// Core Game Engine for Đảo Đèn Lồng (Deterministic Simulation) - Contract v1.1
// Full support for Night 1, Night 2, Night 3, Jump physics, Dash, Drifters, Charms, Wind & Pause

export function createPRNG(seed = 12345) {
  let a = seed >>> 0;
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function round3(val) {
  return Math.round(val * 1000) / 1000;
}

export const DEFAULT_TUNING = {
  player_speed: 6.0,
  jump_speed: 7.0,
  gravity: -20.0,
  dash_speed: 14.0,
  dash_duration_s: 0.2, // 12 ticks
  dash_cooldown_s: 1.5, // 90 ticks
  carry_capacity: 10,
  lantern_cost: 10,
  lantern_count_night1: 5,
  pickup_radius: 1.0,
  interact_radius: 2.0,
  pulse_cost: 3,
  pulse_radius: 5.0,
  pulse_stun_s: 2.0, // 120 ticks
  pulse_push_m: 4.0, // 4m over 15 ticks
  pulse_cooldown_s: 3.0, // 180 ticks
  safe_radius: 6.0,
  shade_speed: 4.0,
  shade_speed_night3: 4.5,
  shade_hit_radius: 1.0,
  invuln_s: 1.5, // 90 ticks
  hit_drop_ratio: 0.5,
  fall_enabled: true,
  night1_duration_s: 300,
  night2_duration_s: 330,
  night3_duration_s: 360,
  flames: 3,
  score: {
    per_mote: 10,
    per_lantern: 100,
    per_stun: 5,
    per_second_left: 2,
    per_flame_left: 50
  }
};

export class GameEngine {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 42;
    this.rng = createPRNG(this.seed);
    this.night = options.night || 1;
    this.tuning = { ...DEFAULT_TUNING, ...(options.tuning || {}) };
    if (options.tuning && options.tuning.score) {
      this.tuning.score = { ...DEFAULT_TUNING.score, ...options.tuning.score };
    }

    this.tick_count = 0;
    this.sim_tick = 0;
    this.state = "playing"; // "playing", "paused", "won", "lost"
    this.paused = false;
    this.score = 0;

    const durations = { 1: this.tuning.night1_duration_s, 2: this.tuning.night2_duration_s, 3: this.tuning.night3_duration_s };
    this.initial_time_left_s = durations[this.night] || 300;
    this.time_left_s = this.initial_time_left_s;

    this.player = {
      pos: [0, 0, 0],
      vel: [0, 0, 0],
      facing: [0, 1], // +Z facing
      grounded: true,
      flames: this.tuning.flames,
      carried: 0,
      invuln_ticks: 0,
      dash_active_ticks: 0,
      dash_cd_ticks: 0,
      dash_dir: [0, 1],
      pulse_cd_ticks: 0,
      charm_ticks: 0,
      launch_active: false,
      launch_vel: [0, 0, 0],
      fall_respawn_ticks: 0
    };

    this.wind = { active: false, dir_deg: 0, timer: 0 };
    this.wind_enabled = true;

    this.prev_input = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      interact: false,
      pulse: false,
      dash: false,
      pause: false
    };

    this.lanterns = [];
    this.motes = [];
    this.shades = [];
    this.drifters = [];
    this.charms = [];

    this.mote_spawn_points = [];
    this.shade_spawn_points = [];
    this.shade_spawn_counter = 0;
    this.next_mote_id = 1;
    this.next_shade_id = 1;
    this.next_drifter_id = 1;

    this.initMap(this.night);

    if (options.scenario) {
      this.applyScenario(options.scenario);
    }
  }

  initMap(night) {
    if (night === 1) {
      this.lanterns = [
        { id: "L1", pos: [0, 0, 25], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L2", pos: [23.8, 0, 7.7], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L3", pos: [14.7, 0, -20.2], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L4", pos: [-14.7, 0, -20.2], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L5", pos: [-23.8, 0, 7.7], deposited: 0, lit: false, safe_push_ticks: 0 }
      ];

      // 8 points at R=12m, 16 points at R=33m
      this.mote_spawn_points = [];
      for (let i = 0; i < 8; i++) {
        const rad = (i * 45 * Math.PI) / 180;
        this.mote_spawn_points.push([round3(12 * Math.cos(rad)), 0, round3(12 * Math.sin(rad))]);
      }
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        this.mote_spawn_points.push([round3(33 * Math.cos(rad)), 0, round3(33 * Math.sin(rad))]);
      }

      // 12 shade spawn points at R=37m
      this.shade_spawn_points = [];
      for (let i = 0; i < 12; i++) {
        const rad = ((15 + i * 30) * Math.PI) / 180;
        this.shade_spawn_points.push([round3(37 * Math.cos(rad)), 0, round3(37 * Math.sin(rad))]);
      }

      // Initial 20 motes on first 20 spawn points
      for (let i = 0; i < 20; i++) {
        const pt = this.mote_spawn_points[i];
        this.motes.push({
          id: `M${this.next_mote_id++}`,
          pos: [...pt],
          kind: "random",
          ttl_ticks: -1
        });
      }
    } else if (night === 2) {
      this.lanterns = [
        { id: "L1", pos: [0, 0, 20], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L2", pos: [17, 0, -10], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L3", pos: [-17, 0, -10], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L4", pos: [70, 0, 20], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L5", pos: [87, 0, -10], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L6", pos: [53, 0, -10], deposited: 0, lit: false, safe_push_ticks: 0 }
      ];

      // Motes spawn points: 4 at R=10m + 8 at R=22m for each island
      this.mote_spawn_points = [];
      const addMotesForCenter = (cx, cz) => {
        for (let i = 0; i < 4; i++) {
          const rad = (i * 90 * Math.PI) / 180;
          this.mote_spawn_points.push([round3(cx + 10 * Math.cos(rad)), 0, round3(cz + 10 * Math.sin(rad))]);
        }
        for (let i = 0; i < 8; i++) {
          const rad = (i * 45 * Math.PI) / 180;
          this.mote_spawn_points.push([round3(cx + 22 * Math.cos(rad)), 0, round3(cz + 22 * Math.sin(rad))]);
        }
      };
      addMotesForCenter(0, 0);
      addMotesForCenter(70, 0);

      // Shades spawn points: 8 at R=26m for each island
      this.shade_spawn_points = [];
      const addShadesForCenter = (cx, cz) => {
        for (let i = 0; i < 8; i++) {
          const rad = ((22.5 + i * 45) * Math.PI) / 180;
          this.shade_spawn_points.push([round3(cx + 26 * Math.cos(rad)), 0, round3(cz + 26 * Math.sin(rad))]);
        }
      };
      addShadesForCenter(0, 0);
      addShadesForCenter(70, 0);

      for (let i = 0; i < 20; i++) {
        const pt = this.mote_spawn_points[i];
        this.motes.push({
          id: `M${this.next_mote_id++}`,
          pos: [...pt],
          kind: "random",
          ttl_ticks: -1
        });
      }

      // Charm C1 on bridge
      this.charms = [{ id: "C1", pos: [35, 0, 0], available: true, respawn_ticks: 0 }];
    } else if (night === 3) {
      this.lanterns = [
        { id: "L1", pos: [0, 6, 6], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L2", pos: [18, 3, 10], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L3", pos: [-18, 3, 10], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L4", pos: [35, 0, -10], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L5", pos: [-35, 0, -10], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L6", pos: [20, 0, -35], deposited: 0, lit: false, safe_push_ticks: 0 },
        { id: "L7", pos: [-20, 0, -35], deposited: 0, lit: false, safe_push_ticks: 0 }
      ];

      this.mote_spawn_points = [];
      // Tier 0: 18 at R=34m
      for (let i = 0; i < 18; i++) {
        const rad = (i * 20 * Math.PI) / 180;
        this.mote_spawn_points.push([round3(34 * Math.cos(rad)), 0, round3(34 * Math.sin(rad))]);
      }
      // Tier 1: 8 at R=18m (20 to 160 deg)
      for (let i = 0; i < 8; i++) {
        const rad = ((20 + i * 20) * Math.PI) / 180;
        this.mote_spawn_points.push([round3(18 * Math.cos(rad)), 3, round3(18 * Math.sin(rad))]);
      }
      // Tier 2: 4 at R=5m (45, 135, 225, 315 deg)
      for (let i = 0; i < 4; i++) {
        const rad = ((45 + i * 90) * Math.PI) / 180;
        this.mote_spawn_points.push([round3(5 * Math.cos(rad)), 6, round3(5 * Math.sin(rad))]);
      }

      // Shades spawn points: 16 at R=43m
      this.shade_spawn_points = [];
      for (let i = 0; i < 16; i++) {
        const rad = (i * 22.5 * Math.PI) / 180;
        this.shade_spawn_points.push([round3(43 * Math.cos(rad)), 0, round3(43 * Math.sin(rad))]);
      }

      for (let i = 0; i < 20; i++) {
        const pt = this.mote_spawn_points[i];
        this.motes.push({
          id: `M${this.next_mote_id++}`,
          pos: [...pt],
          kind: "random",
          ttl_ticks: -1
        });
      }

      // Charms C1, C2
      this.charms = [
        { id: "C1", pos: [30, 0, 25], available: true, respawn_ticks: 0 },
        { id: "C2", pos: [-30, 0, 25], available: true, respawn_ticks: 0 }
      ];
    }
  }

  getGroundHeight(x, z) {
    if (this.night === 1) {
      if (Math.hypot(x, z) <= 40) return 0;
      return -999;
    } else if (this.night === 2) {
      if (Math.hypot(x, z) <= 28) return 0;
      if (Math.hypot(x - 70, z) <= 28) return 0;
      if (x >= 26 && x <= 44 && z >= -2 && z <= 2) return 0;
      return -999;
    } else if (this.night === 3) {
      const r = Math.hypot(x, z);
      // Bell tower cylinder obstruction at center
      if (r <= 2) return 6; // On top of bell tower or blocked
      if (r <= 8) return 6; // Tier 2

      // Check Ramps between R=24 and R=30
      // Ramp 1 at 30 deg, Ramp 2 at 150 deg, width 3m (half-width 1.5m)
      const checkRamp = (angleDeg) => {
        const angleRad = (angleDeg * Math.PI) / 180;
        const rampDirX = Math.cos(angleRad);
        const rampDirZ = Math.sin(angleRad);
        const proj = x * rampDirX + z * rampDirZ;
        const perp = Math.abs(-x * rampDirZ + z * rampDirX);
        if (proj >= 24 && proj <= 30 && perp <= 1.5) {
          return 3 * ((30 - proj) / 6);
        }
        return null;
      };

      const ramp1Height = checkRamp(30);
      if (ramp1Height !== null) return ramp1Height;
      const ramp2Height = checkRamp(150);
      if (ramp2Height !== null) return ramp2Height;

      // Tier 1 (Y=3, ring R in [12, 24] with z > 0)
      if (r >= 12 && r <= 24 && z > 0) return 3;

      // Tier 0 (Y=0, R <= 45)
      if (r <= 45) return 0;

      return -999;
    }
    return 0;
  }

  applyScenario(scenario) {
    if (scenario.time_left_s !== undefined) {
      this.initial_time_left_s = scenario.time_left_s;
      this.time_left_s = scenario.time_left_s;
    }

    if (scenario.player) {
      if (scenario.player.pos) this.player.pos = [...scenario.player.pos];
      if (scenario.player.flames !== undefined) this.player.flames = scenario.player.flames;
      if (scenario.player.carried !== undefined) this.player.carried = scenario.player.carried;
      if (scenario.player.invuln_ticks !== undefined) this.player.invuln_ticks = scenario.player.invuln_ticks;
      if (scenario.player.dash_cd_ticks !== undefined) this.player.dash_cd_ticks = scenario.player.dash_cd_ticks;
      if (scenario.player.pulse_cd_ticks !== undefined) this.player.pulse_cd_ticks = scenario.player.pulse_cd_ticks;
      if (scenario.player.charm_ticks !== undefined) this.player.charm_ticks = scenario.player.charm_ticks;
    }

    if (scenario.wind_enabled !== undefined) {
      this.wind_enabled = scenario.wind_enabled;
    }

    if (scenario.random_motes === false) {
      this.motes = [];
    }

    if (scenario.random_shades === false) {
      this.shades = [];
    }

    if (scenario.random_drifters === false) {
      this.drifters = [];
    }

    if (Array.isArray(scenario.motes)) {
      this.motes = scenario.motes.map((m, idx) => {
        if (Array.isArray(m)) {
          return { id: `M${idx + 1}`, pos: [m[0], m[1] || 0, m[2]], kind: "random", ttl_ticks: -1 };
        }
        return {
          id: m.id || `M${idx + 1}`,
          pos: [m.pos[0], m.pos[1] || 0, m.pos[2]],
          kind: m.kind || "random",
          ttl_ticks: m.ttl_s ? Math.round(m.ttl_s * 60) : -1
        };
      });
    }

    if (Array.isArray(scenario.shades)) {
      this.shades = scenario.shades.map((s, idx) => ({
        id: s.id || `S${idx + 1}`,
        pos: [s.pos[0], s.pos[1] || 0, s.pos[2]],
        state: s.state || "wander",
        state_ticks_left: s.state_ticks_left || 0,
        recoil_dir: [0, 0],
        push_dir: [0, 0],
        push_ticks: 0
      }));
    }

    if (Array.isArray(scenario.drifters)) {
      this.drifters = scenario.drifters.map((d, idx) => ({
        id: d.id || `D${idx + 1}`,
        pos: [d.pos[0], d.pos[1] || 0, d.pos[2]],
        state: d.state || "idle",
        stolen: d.stolen || 0,
        flee_ticks: d.flee_ticks || 0,
        dir: [0, 1]
      }));
    }

    if (Array.isArray(scenario.charms)) {
      this.charms = scenario.charms.map((c) => ({
        id: c.id,
        pos: c.pos ? [...c.pos] : [0, 0, 0],
        available: c.available !== undefined ? c.available : true,
        respawn_ticks: c.respawn_s ? Math.round(c.respawn_s * 60) : 0
      }));
    }

    if (Array.isArray(scenario.lanterns)) {
      for (const item of scenario.lanterns) {
        const found = this.lanterns.find((l) => l.id === item.id);
        if (found) {
          if (item.pos) found.pos = [...item.pos];
          if (item.deposited !== undefined) found.deposited = item.deposited;
          if (item.lit !== undefined) found.lit = item.lit;
        } else {
          this.lanterns.push({
            id: item.id,
            pos: item.pos ? [...item.pos] : [0, 0, 0],
            deposited: item.deposited || 0,
            lit: !!item.lit,
            safe_push_ticks: 0
          });
        }
      }
    }
  }

  step(rawInput = {}) {
    const events = [];
    const dt = 1 / 60;
    this.tick_count += 1;

    // Merge input
    const input = {
      move: rawInput.move !== undefined ? rawInput.move : this.prev_input.move,
      cam_yaw_deg: rawInput.cam_yaw_deg !== undefined ? rawInput.cam_yaw_deg : this.prev_input.cam_yaw_deg,
      jump: rawInput.jump !== undefined ? rawInput.jump : this.prev_input.jump,
      interact: rawInput.interact !== undefined ? rawInput.interact : this.prev_input.interact,
      pulse: rawInput.pulse !== undefined ? rawInput.pulse : this.prev_input.pulse,
      dash: rawInput.dash !== undefined ? rawInput.dash : this.prev_input.dash,
      pause: rawInput.pause !== undefined ? rawInput.pause : this.prev_input.pause
    };

    const pauseTriggered = input.pause && !this.prev_input.pause;

    // 1. Process pause
    if (pauseTriggered) {
      this.paused = !this.paused;
      if (this.paused) {
        this.state = "paused";
        events.push({ type: "event", tick: this.sim_tick + 1, name: "paused", data: {} });
        this.prev_input = input;
        return events;
      } else {
        this.state = "playing";
        events.push({ type: "event", tick: this.sim_tick + 1, name: "resumed", data: {} });
      }
    }

    if (this.paused) {
      this.prev_input = input;
      return events;
    }

    if (this.state !== "playing") {
      this.prev_input = input;
      return events;
    }

    this.sim_tick += 1;
    const currentTick = this.sim_tick;

    const jumpTriggered = input.jump && !this.prev_input.jump;
    const interactTriggered = input.interact && !this.prev_input.interact;
    const pulseTriggered = input.pulse && !this.prev_input.pulse;
    const dashTriggered = input.dash && !this.prev_input.dash;

    // 2. Decrement counters
    if (this.player.dash_cd_ticks > 0) this.player.dash_cd_ticks -= 1;
    if (this.player.pulse_cd_ticks > 0) this.player.pulse_cd_ticks -= 1;
    if (this.player.invuln_ticks > 0) this.player.invuln_ticks -= 1;
    if (this.player.charm_ticks > 0) this.player.charm_ticks -= 1;
    if (this.player.dash_active_ticks > 0) this.player.dash_active_ticks -= 1;

    for (const c of this.charms) {
      if (!c.available && c.respawn_ticks > 0) {
        c.respawn_ticks -= 1;
        if (c.respawn_ticks <= 0) c.available = true;
      }
    }

    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      if (m.ttl_ticks > 0) {
        m.ttl_ticks -= 1;
        if (m.ttl_ticks <= 0) this.motes.splice(i, 1);
      }
    }

    for (const s of this.shades) {
      if (s.state_ticks_left > 0) {
        s.state_ticks_left -= 1;
        if (s.state_ticks_left <= 0) {
          if (s.state === "stunned" || s.state === "recoil" || s.state === "spawning") {
            s.state = "wander";
          }
        }
      }
      if (s.push_ticks > 0) s.push_ticks -= 1;
    }

    for (const l of this.lanterns) {
      if (l.safe_push_ticks > 0) l.safe_push_ticks -= 1;
    }

    // 3. Move Mây & Jump / Dash physics
    let mx = input.move[0] || 0;
    let mz = input.move[1] || 0;
    const theta = ((input.cam_yaw_deg || 0) * Math.PI) / 180;
    let vx = mx * Math.cos(theta) + mz * Math.sin(theta);
    let vz = -mx * Math.sin(theta) + mz * Math.cos(theta);
    const speedLen = Math.hypot(vx, vz);
    if (speedLen > 1.0) {
      vx /= speedLen;
      vz /= speedLen;
    }

    if (speedLen > 0.05) {
      this.player.facing = [vx, vz];
    }

    // Trigger Dash
    if (dashTriggered && this.player.dash_cd_ticks <= 0 && this.player.dash_active_ticks <= 0) {
      this.player.dash_active_ticks = 12; // 0.2s = 12 ticks
      this.player.dash_cd_ticks = this.player.charm_ticks > 0 ? 0 : 90; // 1.5s = 90 ticks
      this.player.dash_dir = speedLen > 0.05 ? [vx, vz] : [...this.player.facing];
      this.player.vel[1] = 0; // Air dash maintains altitude
      events.push({ type: "event", tick: currentTick, name: "dash", data: {} });
    }

    // Jump
    if (jumpTriggered && this.player.grounded && this.player.dash_active_ticks <= 0) {
      this.player.vel[1] = this.tuning.jump_speed;
      this.player.grounded = false;
    }

    // Jump pad triggers on Night 2
    if (this.night === 2 && this.player.grounded) {
      // Pad 1 at (20, 0, 18) -> launch towards Island B (70, 0, 0)
      if (Math.hypot(this.player.pos[0] - 20, this.player.pos[2] - 18) <= 1.0) {
        this.player.launch_active = true;
        this.player.vel[1] = 14.0;
        const dx = 50;
        const dz = -18;
        const dist = Math.hypot(dx, dz);
        this.player.launch_vel = [(dx / dist) * 24.0, 0, (dz / dist) * 24.0];
        this.player.grounded = false;
      }
      // Pad 2 at (50, 0, -18) -> launch towards Island A (0, 0, 0)
      else if (Math.hypot(this.player.pos[0] - 50, this.player.pos[2] - -18) <= 1.0) {
        this.player.launch_active = true;
        this.player.vel[1] = 14.0;
        const dx = -50;
        const dz = 18;
        const dist = Math.hypot(dx, dz);
        this.player.launch_vel = [(dx / dist) * 24.0, 0, (dz / dist) * 24.0];
        this.player.grounded = false;
      }
    }

    // Jump pad on Night 3 at (0, 3, 13)
    if (this.night === 3 && this.player.grounded && Math.abs(this.player.pos[1] - 3) <= 0.5) {
      if (Math.hypot(this.player.pos[0], this.player.pos[2] - 13) <= 1.0) {
        this.player.launch_active = true;
        this.player.vel[1] = 12.0;
        this.player.launch_vel = [0, 0, -8.0];
        this.player.grounded = false;
      }
    }

    // Wind on Night 3
    let windPushX = 0;
    let windPushZ = 0;
    if (this.night === 3 && this.wind_enabled) {
      const cycleTick = currentTick % 1800; // 30s cycle
      if (cycleTick >= 1800 - 300) {
        // Active wind for 5s (300 ticks)
        this.wind.active = true;
        const wRad = (this.wind.dir_deg * Math.PI) / 180;
        windPushX = Math.cos(wRad) * 2.0;
        windPushZ = Math.sin(wRad) * 2.0;
      } else {
        this.wind.active = false;
        if (cycleTick === 0) {
          this.wind.dir_deg = Math.floor(this.rng() * 360);
        }
      }
    }

    // Apply movement
    let moveSpeed = this.player.charm_ticks > 0 ? 7.2 : this.tuning.player_speed;
    if (this.player.dash_active_ticks > 0) {
      this.player.pos[0] += this.player.dash_dir[0] * this.tuning.dash_speed * dt;
      this.player.pos[2] += this.player.dash_dir[1] * this.tuning.dash_speed * dt;
      this.player.vel[0] = this.player.dash_dir[0] * this.tuning.dash_speed;
      this.player.vel[2] = this.player.dash_dir[1] * this.tuning.dash_speed;
    } else if (this.player.launch_active) {
      this.player.pos[0] += this.player.launch_vel[0] * dt;
      this.player.pos[2] += this.player.launch_vel[2] * dt;
      this.player.vel[0] = this.player.launch_vel[0];
      this.player.vel[2] = this.player.launch_vel[2];
    } else {
      this.player.pos[0] += (vx * moveSpeed + windPushX) * dt;
      this.player.pos[2] += (vz * moveSpeed + windPushZ) * dt;
      this.player.vel[0] = vx * moveSpeed + windPushX;
      this.player.vel[2] = vz * moveSpeed + windPushZ;
    }

    // Vertical physics
    if (this.player.dash_active_ticks <= 0) {
      this.player.vel[1] += this.tuning.gravity * dt;
      this.player.pos[1] += this.player.vel[1] * dt;
    }

    const groundY = this.getGroundHeight(this.player.pos[0], this.player.pos[2]);
    if (groundY > -900 && this.player.pos[1] <= groundY) {
      this.player.pos[1] = groundY;
      this.player.vel[1] = 0;
      this.player.grounded = true;
      this.player.launch_active = false;
    } else if (groundY <= -900) {
      this.player.grounded = false;
    }

    // Fall check (Y < -10)
    if (this.player.pos[1] < -10) {
      this.player.flames -= 1;
      this.player.carried = 0;
      this.player.vel = [0, 0, 0];
      this.player.launch_active = false;
      this.player.dash_active_ticks = 0;

      events.push({
        type: "event",
        tick: currentTick,
        name: "player_hit",
        data: { by: "fall", flames: this.player.flames, dropped: 0, lost: true }
      });

      if (this.player.flames <= 0) {
        this.state = "lost";
        events.push({
          type: "event",
          tick: currentTick,
          name: "game_over",
          data: { result: "lost", reason: "no_flames" }
        });
        this.prev_input = input;
        return events;
      } else {
        // Respawn at origin after fall
        this.player.pos = [0, 0, 0];
        this.player.grounded = true;
        this.player.invuln_ticks = 90;
      }
    }

    // 4. Pickup motes and charms
    // Motes
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      // Pickable if not newly dropped on this tick
      if (m.ttl_ticks === 480) continue;

      const distXZ = Math.hypot(this.player.pos[0] - m.pos[0], this.player.pos[2] - m.pos[2]);
      const distY = Math.abs(this.player.pos[1] - m.pos[1]);

      if (distXZ <= this.tuning.pickup_radius && distY <= 1.5 && this.player.carried < this.tuning.carry_capacity) {
        this.player.carried += 1;
        this.motes.splice(i, 1);
        events.push({
          type: "event",
          tick: currentTick,
          name: "mote_picked",
          data: { carried: this.player.carried }
        });
      }
    }

    // Charms
    for (const c of this.charms) {
      if (c.available) {
        const distXZ = Math.hypot(this.player.pos[0] - c.pos[0], this.player.pos[2] - c.pos[2]);
        const distY = Math.abs(this.player.pos[1] - c.pos[1]);
        if (distXZ <= 1.0 && distY <= 1.5) {
          c.available = false;
          c.respawn_ticks = 2700; // 45s = 2700 ticks
          this.player.charm_ticks = 600; // 10s = 600 ticks
          this.player.dash_cd_ticks = 0; // Zero dash cd
          events.push({
            type: "event",
            tick: currentTick,
            name: "charm_picked",
            data: { charm_id: c.id, charm_ticks: 600 }
          });
        }
      }
    }

    // 5. Interact with lanterns
    if (interactTriggered) {
      const unlit = this.lanterns.filter((l) => !l.lit);
      let nearest = null;
      let minDist = Infinity;
      for (const l of unlit) {
        const d = Math.hypot(this.player.pos[0] - l.pos[0], this.player.pos[2] - l.pos[2]);
        if (d <= this.tuning.interact_radius) {
          if (d < minDist || (Math.abs(d - minDist) < 0.001 && nearest && l.id < nearest.id)) {
            minDist = d;
            nearest = l;
          }
        }
      }

      if (nearest && this.player.carried > 0) {
        const needed = this.tuning.lantern_cost - nearest.deposited;
        const amount = Math.min(this.player.carried, needed);
        nearest.deposited += amount;
        this.player.carried -= amount;
        this.score += amount * this.tuning.score.per_mote; // +10 per mote deposited

        events.push({
          type: "event",
          tick: currentTick,
          name: "deposit",
          data: { lantern_id: nearest.id, amount, deposited: nearest.deposited }
        });

        if (nearest.deposited >= this.tuning.lantern_cost) {
          nearest.lit = true;
          nearest.safe_push_ticks = 30; // Push out inside shades for 30 ticks
          this.score += this.tuning.score.per_lantern;
          events.push({
            type: "event",
            tick: currentTick,
            name: "lantern_lit",
            data: { lantern_id: nearest.id }
          });

          // Check win
          if (this.lanterns.every((l) => l.lit)) {
            this.state = "won";
            const secondsLeft = Math.max(0, this.time_left_s);
            this.score += Math.floor(secondsLeft) * this.tuning.score.per_second_left;
            this.score += this.player.flames * this.tuning.score.per_flame_left;
            events.push({
              type: "event",
              tick: currentTick,
              name: "game_over",
              data: { result: "won", reason: "all_lit" }
            });
            this.prev_input = input;
            return events;
          }
        }
      }
    }

    // 6. Pulse
    if (pulseTriggered && this.player.pulse_cd_ticks <= 0 && this.player.carried >= this.tuning.pulse_cost) {
      this.player.carried -= this.tuning.pulse_cost;
      this.player.pulse_cd_ticks = Math.round(this.tuning.pulse_cooldown_s * 60);

      const pulseCenter = [this.player.pos[0], this.player.pos[1] + 0.8, this.player.pos[2]];
      const stunned_ids = [];

      for (const s of this.shades) {
        const dist3D = Math.hypot(s.pos[0] - pulseCenter[0], s.pos[1] - pulseCenter[1], s.pos[2] - pulseCenter[2]);
        if (dist3D <= this.tuning.pulse_radius) {
          s.state = "stunned";
          s.state_ticks_left = Math.round(this.tuning.pulse_stun_s * 60);
          s.push_ticks = 15;
          const hDist = Math.hypot(s.pos[0] - this.player.pos[0], s.pos[2] - this.player.pos[2]);
          if (hDist > 0.001) {
            s.push_dir = [(s.pos[0] - this.player.pos[0]) / hDist, (s.pos[2] - this.player.pos[2]) / hDist];
          } else {
            s.push_dir = [1, 0];
          }
          stunned_ids.push(s.id);
          this.score += this.tuning.score.per_stun; // +5 per shade hit
        }
      }

      // Check pulse on Drifters
      for (const d of this.drifters) {
        const dist3D = Math.hypot(d.pos[0] - pulseCenter[0], d.pos[1] - pulseCenter[1], d.pos[2] - pulseCenter[2]);
        if (dist3D <= this.tuning.pulse_radius) {
          if (d.state === "chase") {
            d.state = "flee";
            d.flee_ticks = 240;
          } else if (d.state === "flee" && d.stolen > 0) {
            // Drop stolen motes
            for (let k = 0; k < d.stolen; k++) {
              this.motes.push({
                id: `M${this.next_mote_id++}`,
                pos: [...d.pos],
                kind: "dropped",
                ttl_ticks: 480
              });
            }
            events.push({
              type: "event",
              tick: currentTick,
              name: "drifter_drop",
              data: { drifter_id: d.id, amount: d.stolen }
            });
            d.stolen = 0;
            d.flee_ticks = 120;
          }
        }
      }

      events.push({
        type: "event",
        tick: currentTick,
        name: "pulse",
        data: { stunned_ids }
      });
    }

    // 7. Move Shades & Drifters
    const shadeSpeed = this.night === 3 ? this.tuning.shade_speed_night3 : this.tuning.shade_speed;
    const litLanterns = this.lanterns.filter((l) => l.lit);

    for (const s of this.shades) {
      if (s.state === "spawning") continue;

      if (s.state === "stunned") {
        if (s.push_ticks > 0) {
          // Push 4m over 15 ticks = (4 / 15) m per tick
          s.pos[0] += s.push_dir[0] * (this.tuning.pulse_push_m / 15);
          s.pos[2] += s.push_dir[1] * (this.tuning.pulse_push_m / 15);
        }
      } else if (s.state === "recoil") {
        // Recoil 2m over 60 ticks = 2 / 60 m per tick
        s.pos[0] += s.recoil_dir[0] * (2.0 / 60);
        s.pos[2] += s.recoil_dir[1] * (2.0 / 60);
      } else {
        const dx = this.player.pos[0] - s.pos[0];
        const dz = this.player.pos[2] - s.pos[2];
        const distPlayer = Math.hypot(dx, dz);

        if (s.state === "wander" && distPlayer <= 12.0) {
          s.state = "chase";
        } else if (s.state === "chase" && distPlayer > 18.0) {
          s.state = "wander";
        }

        if (s.state === "chase" && distPlayer > 0.001) {
          let nX = s.pos[0] + (dx / distPlayer) * shadeSpeed * dt;
          let nZ = s.pos[2] + (dz / distPlayer) * shadeSpeed * dt;

          // Safe zone check around lit lanterns (6m)
          let blocked = false;
          for (const l of litLanterns) {
            const curDist = Math.hypot(s.pos[0] - l.pos[0], s.pos[2] - l.pos[2]);
            const nextDist = Math.hypot(nX - l.pos[0], nZ - l.pos[2]);

            if (curDist >= this.tuning.safe_radius && nextDist < this.tuning.safe_radius) {
              blocked = true;
              break;
            }
            if (curDist < this.tuning.safe_radius) {
              // Push to edge
              const dirX = s.pos[0] - l.pos[0] || 1;
              const dirZ = s.pos[2] - l.pos[2] || 0;
              const len = Math.hypot(dirX, dirZ) || 1;
              nX = s.pos[0] + (dirX / len) * (this.tuning.safe_radius / 30);
              nZ = s.pos[2] + (dirZ / len) * (this.tuning.safe_radius / 30);
              break;
            }
          }

          if (!blocked) {
            s.pos[0] = nX;
            s.pos[2] = nZ;
          }
        }
      }
    }

    // Move Drifters
    for (let i = this.drifters.length - 1; i >= 0; i--) {
      const d = this.drifters[i];
      if (d.state === "idle") {
        const distPlayer = Math.hypot(this.player.pos[0] - d.pos[0], this.player.pos[2] - d.pos[2]);
        if (this.player.carried >= 5 && distPlayer <= 15.0) {
          d.state = "chase";
        } else {
          // Idle wander 2 m/s
          d.pos[0] += d.dir[0] * 2.0 * dt;
          d.pos[2] += d.dir[1] * 2.0 * dt;
        }
      } else if (d.state === "chase") {
        const dx = this.player.pos[0] - d.pos[0];
        const dz = this.player.pos[2] - d.pos[2];
        const distPlayer = Math.hypot(dx, dz);
        if (this.player.carried < 5 || distPlayer > 15.0) {
          d.state = "idle";
        } else if (distPlayer > 0.001) {
          d.pos[0] += (dx / distPlayer) * 7.0 * dt;
          d.pos[2] += (dz / distPlayer) * 7.0 * dt;
        }
      } else if (d.state === "flee") {
        d.pos[0] += d.dir[0] * 7.0 * dt;
        d.pos[2] += d.dir[1] * 7.0 * dt;
        d.flee_ticks -= 1;
        if (d.flee_ticks <= 0) {
          this.drifters.splice(i, 1);
        }
      }
    }

    // 8. Touches: Drifters steal first, then Shades inflict hit
    // Drifter steals
    for (const d of this.drifters) {
      if (d.state === "chase") {
        const distXZ = Math.hypot(this.player.pos[0] - d.pos[0], this.player.pos[2] - d.pos[2]);
        if (distXZ <= 1.2) {
          const stolenAmount = Math.min(3, this.player.carried);
          this.player.carried -= stolenAmount;
          d.stolen = stolenAmount;
          d.state = "flee";
          d.flee_ticks = 240;
          const awayX = d.pos[0] - this.player.pos[0] || 0;
          const awayZ = d.pos[2] - this.player.pos[2] || 1;
          const aLen = Math.hypot(awayX, awayZ) || 1;
          d.dir = [awayX / aLen, awayZ / aLen];

          events.push({
            type: "event",
            tick: currentTick,
            name: "drifter_steal",
            data: { drifter_id: d.id, amount: stolenAmount, carried: this.player.carried }
          });
        }
      }
    }

    // Shades hit
    const sortedShades = [...this.shades].sort((a, b) => a.id.localeCompare(b.id));
    for (const s of sortedShades) {
      if (s.state !== "chase" && s.state !== "wander") continue;

      const distXZ = Math.hypot(this.player.pos[0] - s.pos[0], this.player.pos[2] - s.pos[2]);
      const distY = Math.abs(this.player.pos[1] - s.pos[1]);

      if (distXZ <= this.tuning.shade_hit_radius && distY <= 1.5) {
        if (this.player.invuln_ticks <= 0) {
          this.player.flames -= 1;
          this.player.invuln_ticks = 90; // 1.5s = 90 ticks

          // Drop floor(carried / 2) motes in ring 1.5 - 2.5m
          const dropCount = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
          this.player.carried -= dropCount;

          for (let k = 0; k < dropCount; k++) {
            const angle = (k * (Math.PI * 2)) / Math.max(1, dropCount);
            const rDrop = 1.5 + this.rng() * 1.0;
            this.motes.push({
              id: `M${this.next_mote_id++}`,
              pos: [round3(this.player.pos[0] + Math.cos(angle) * rDrop), this.player.pos[1], round3(this.player.pos[2] + Math.sin(angle) * rDrop)],
              kind: "dropped",
              ttl_ticks: 480
            });
          }

          // Recoil shade 2m in 60 ticks
          s.state = "recoil";
          s.state_ticks_left = 60;
          const rX = s.pos[0] - this.player.pos[0] || 1;
          const rZ = s.pos[2] - this.player.pos[2] || 0;
          const rLen = Math.hypot(rX, rZ) || 1;
          s.recoil_dir = [rX / rLen, rZ / rLen];

          events.push({
            type: "event",
            tick: currentTick,
            name: "player_hit",
            data: { by: "shade", flames: this.player.flames, dropped: dropCount }
          });

          if (this.player.flames <= 0) {
            this.state = "lost";
            events.push({
              type: "event",
              tick: currentTick,
              name: "game_over",
              data: { result: "lost", reason: "no_flames" }
            });
            break;
          }
        }
      }
    }

    // 9. Spawn schedule
    // Motes spawn at 240, 480, ... if total < 30
    if (currentTick % 240 === 0 && this.motes.length < 30) {
      const occupied = new Set(this.motes.map((m) => `${round3(m.pos[0])},${round3(m.pos[2])}`));
      const emptyPoint = this.mote_spawn_points.find((p) => !occupied.has(`${round3(p[0])},${round3(p[2])}`));
      if (emptyPoint) {
        this.motes.push({
          id: `M${this.next_mote_id++}`,
          pos: [...emptyPoint],
          kind: "random",
          ttl_ticks: -1
        });
      }
    }

    // Shade spawn schedule
    const maxShades = { 1: 6, 2: 8, 3: 10 }[this.night] || 6;
    const spawnInterval = { 1: 480, 2: 420, 3: 360 }[this.night] || 480;

    let shouldSpawnShade = false;
    let spawnCount = 0;
    if (currentTick === 300) {
      shouldSpawnShade = true;
      spawnCount = 2;
    } else if (currentTick > 300 && (currentTick - 300) % spawnInterval === 0) {
      shouldSpawnShade = true;
      spawnCount = 1;
    }

    if (shouldSpawnShade && this.shades.length < maxShades) {
      for (let k = 0; k < spawnCount && this.shades.length < maxShades; k++) {
        // Find point with dist to player >= 15m
        const pt = this.shade_spawn_points.find((p) => Math.hypot(p[0] - this.player.pos[0], p[2] - this.player.pos[2]) >= 15.0);
        if (pt) {
          const shadeId = `S${this.next_shade_id++}`;
          this.shades.push({
            id: shadeId,
            pos: [...pt],
            state: "spawning",
            state_ticks_left: 60,
            recoil_dir: [0, 0],
            push_dir: [0, 0],
            push_ticks: 0
          });
          events.push({ type: "event", tick: currentTick, name: "shade_spawned", data: { id: shadeId } });
        }
      }
    }

    // Drifter spawn schedule at tick 1200, 2400 on Night 2 and 3
    if ((this.night === 2 || this.night === 3) && currentTick % 1200 === 0 && this.drifters.length < 2) {
      const dId = `D${this.next_drifter_id++}`;
      const angle = this.rng() * Math.PI * 2;
      const r = 25 + this.rng() * 10;
      this.drifters.push({
        id: dId,
        pos: [round3(Math.cos(angle) * r), 2, round3(Math.sin(angle) * r)],
        state: "idle",
        stolen: 0,
        flee_ticks: 0,
        dir: [Math.cos(angle), Math.sin(angle)]
      });
    }

    // 10. Update time left & win/loss
    this.time_left_s = Math.max(0, this.initial_time_left_s - this.sim_tick / 60);

    if (this.state === "playing" && this.time_left_s <= 0) {
      if (this.player.flames > 0 && this.lanterns.every((l) => l.lit)) {
        this.state = "won";
        events.push({
          type: "event",
          tick: currentTick,
          name: "game_over",
          data: { result: "won", reason: "all_lit" }
        });
      } else {
        this.state = "lost";
        events.push({
          type: "event",
          tick: currentTick,
          name: "game_over",
          data: { result: "lost", reason: "dawn" }
        });
      }
    }

    this.prev_input = input;
    return events;
  }

  getSnapshot() {
    return {
      type: "snapshot",
      tick: this.sim_tick,
      sim_tick: this.sim_tick,
      night: this.night,
      state: this.state,
      time_left_s: round3(Math.max(0, this.time_left_s)),
      score: this.score,
      wind: {
        active: this.wind.active,
        dir_deg: this.wind.dir_deg
      },
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        vel: [round3(this.player.vel[0]), round3(this.player.vel[1]), round3(this.player.vel[2])],
        grounded: this.player.grounded,
        flames: this.player.flames,
        carried: this.player.carried,
        invuln: this.player.invuln_ticks > 0,
        dash_cd_s: round3(Math.max(0, this.player.dash_cd_ticks / 60)),
        pulse_cd_s: round3(Math.max(0, this.player.pulse_cd_ticks / 60)),
        charm_s: round3(Math.max(0, this.player.charm_ticks / 60))
      },
      lanterns: this.lanterns.map((l) => ({
        id: l.id,
        pos: [round3(l.pos[0]), round3(l.pos[1]), round3(l.pos[2])],
        lit: l.lit,
        deposited: l.deposited
      })),
      shades: this.shades.map((s) => ({
        id: s.id,
        pos: [round3(s.pos[0]), round3(s.pos[1]), round3(s.pos[2])],
        state: s.state
      })),
      drifters: this.drifters.map((d) => ({
        id: d.id,
        pos: [round3(d.pos[0]), round3(d.pos[1]), round3(d.pos[2])],
        state: d.state,
        stolen: d.stolen
      })),
      motes: this.motes.map((m) => ({
        id: m.id,
        pos: [round3(m.pos[0]), round3(m.pos[1]), round3(m.pos[2])],
        kind: m.kind,
        ttl_s: m.ttl_ticks > 0 ? round3(m.ttl_ticks / 60) : 0
      })),
      charms: this.charms.map((c) => ({
        id: c.id,
        available: c.available,
        respawn_s: c.respawn_ticks > 0 ? round3(c.respawn_ticks / 60) : 0
      })),
      motes_active: this.motes.length
    };
  }

  getEndRecord() {
    return {
      type: "end",
      ticks: this.sim_tick,
      state: this.state,
      score: this.score
    };
  }
}
