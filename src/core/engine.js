// Core Game Engine for Đảo Đèn Lồng (Deterministic Simulation)
// Runs in both Node.js (Headless) and Web Browser (Three.js 3D GUI)

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
  carry_capacity: 5,
  lantern_cost: 3,
  lantern_count_night1: 5,
  pickup_radius: 2.0,
  interact_radius: 2.5,
  pulse_cost: 1,
  pulse_radius: 6.0,
  night1_duration_s: 180,
  flames: 3,
  invuln_s: 2.0,
  hit_drop_ratio: 0.5,
  pulse_stun_s: 3.0,
  pulse_push_m: 2.0,
  pulse_cooldown_s: 1.0,
  safe_radius: 4.0,
  shade_speed: 3.2,
  shade_hit_radius: 1.2,
  fall_enabled: false,
  score: {
    per_mote: 10,
    per_lantern: 100,
    per_stun: 20,
    per_second_left: 5,
    per_flame_left: 50
  }
};

export class GameEngine {
  constructor(options = {}) {
    this.seed = options.seed !== undefined ? options.seed : 42;
    this.rng = createPRNG(this.seed);
    this.tuning = { ...DEFAULT_TUNING, ...(options.tuning || {}) };
    if (options.tuning && options.tuning.score) {
      this.tuning.score = { ...DEFAULT_TUNING.score, ...options.tuning.score };
    }

    this.sim_tick = 0;
    this.state = "playing"; // "playing", "won", "lost"
    this.score = 0;
    this.initial_time_left_s = this.tuning.night1_duration_s;
    this.time_left_s = this.initial_time_left_s;

    this.player = {
      pos: [0, 0, 0],
      flames: this.tuning.flames,
      carried: 0,
      invuln_timer: 0
    };

    this.pulse_cooldown = 0;
    this.prev_input = {
      move: [0, 0],
      cam_yaw_deg: 0,
      jump: false,
      interact: false,
      pulse: false
    };

    // Default 5 Lanterns spread evenly across island (R = 25m)
    this.lanterns = [
      { id: "L1", pos: [0, 0, 25], deposited: 0, lit: false },
      { id: "L2", pos: [23.776, 0, 7.725], deposited: 0, lit: false },
      { id: "L3", pos: [14.695, 0, -20.225], deposited: 0, lit: false },
      { id: "L4", pos: [-14.695, 0, -20.225], deposited: 0, lit: false },
      { id: "L5", pos: [-23.776, 0, 7.725], deposited: 0, lit: false }
    ];

    this.motes = [];
    this.shades = [];

    // Initialize default random motes and shades
    this.initDefaultEntities();

    // Apply scenario if supplied
    if (options.scenario) {
      this.applyScenario(options.scenario);
    }
  }

  initDefaultEntities() {
    // Generate default motes
    const moteCount = 20;
    for (let i = 1; i <= moteCount; i++) {
      const angle = this.rng() * Math.PI * 2;
      const dist = 5 + this.rng() * 28;
      this.motes.push({
        id: `M${i}`,
        pos: [round3(Math.cos(angle) * dist), 0, round3(Math.sin(angle) * dist)]
      });
    }

    // Generate default shades
    const shadeCount = 3;
    for (let i = 1; i <= shadeCount; i++) {
      const angle = (i * (Math.PI * 2)) / shadeCount;
      const dist = 28 + this.rng() * 4;
      this.shades.push({
        id: `S${i}`,
        pos: [round3(Math.cos(angle) * dist), 0, round3(Math.sin(angle) * dist)],
        state: "chase",
        stun_timer: 0
      });
    }
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
    }

    if (scenario.random_motes === false) {
      this.motes = [];
    }

    if (scenario.random_shades === false) {
      this.shades = [];
    }

    if (Array.isArray(scenario.motes)) {
      this.motes = scenario.motes.map((m, idx) => {
        if (Array.isArray(m)) {
          return { id: `M${idx + 1}`, pos: [m[0], m[1] || 0, m[2]] };
        }
        return { id: m.id || `M${idx + 1}`, pos: [m.pos[0], m.pos[1] || 0, m.pos[2]] };
      });
    }

    if (Array.isArray(scenario.shades)) {
      this.shades = scenario.shades.map((s, idx) => ({
        id: s.id || `S${idx + 1}`,
        pos: [s.pos[0], s.pos[1] || 0, s.pos[2]],
        state: s.state || "chase",
        stun_timer: 0
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
            lit: !!item.lit
          });
        }
      }
    }
  }

  step(rawInput = {}) {
    if (this.state !== "playing") {
      return [];
    }

    const events = [];
    const dt = 1 / 60;
    this.sim_tick += 1;
    const currentTick = this.sim_tick;

    // Merge input with previous values for missing fields
    const input = {
      move: rawInput.move !== undefined ? rawInput.move : this.prev_input.move,
      cam_yaw_deg: rawInput.cam_yaw_deg !== undefined ? rawInput.cam_yaw_deg : this.prev_input.cam_yaw_deg,
      jump: rawInput.jump !== undefined ? rawInput.jump : this.prev_input.jump,
      interact: rawInput.interact !== undefined ? rawInput.interact : this.prev_input.interact,
      pulse: rawInput.pulse !== undefined ? rawInput.pulse : this.prev_input.pulse
    };

    // Calculate rising edges
    const interactTriggered = input.interact && !this.prev_input.interact;
    const pulseTriggered = input.pulse && !this.prev_input.pulse;

    // 1. Move player
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

    this.player.pos[0] += vx * this.tuning.player_speed * dt;
    this.player.pos[2] += vz * this.tuning.player_speed * dt;

    // 2. Mote pickup
    for (let i = this.motes.length - 1; i >= 0; i--) {
      const m = this.motes[i];
      const dist = Math.hypot(this.player.pos[0] - m.pos[0], this.player.pos[2] - m.pos[2]);
      if (dist <= this.tuning.pickup_radius && this.player.carried < this.tuning.carry_capacity) {
        this.player.carried += 1;
        this.score += this.tuning.score.per_mote;
        this.motes.splice(i, 1);
        events.push({
          type: "event",
          tick: currentTick,
          name: "mote_picked",
          data: { carried: this.player.carried }
        });
      }
    }

    // 3. Lantern interact
    if (interactTriggered) {
      let nearest = null;
      let minDist = Infinity;
      for (const lantern of this.lanterns) {
        const d = Math.hypot(this.player.pos[0] - lantern.pos[0], this.player.pos[2] - lantern.pos[2]);
        if (d <= this.tuning.interact_radius && d < minDist) {
          minDist = d;
          nearest = lantern;
        }
      }

      if (nearest && !nearest.lit && this.player.carried > 0) {
        const needed = this.tuning.lantern_cost - nearest.deposited;
        const depositAmount = Math.min(this.player.carried, needed);
        nearest.deposited += depositAmount;
        this.player.carried -= depositAmount;

        events.push({
          type: "event",
          tick: currentTick,
          name: "deposit",
          data: {
            lantern_id: nearest.id,
            amount: depositAmount,
            deposited: nearest.deposited
          }
        });

        if (nearest.deposited >= this.tuning.lantern_cost) {
          nearest.lit = true;
          this.score += this.tuning.score.per_lantern;
          events.push({
            type: "event",
            tick: currentTick,
            name: "lantern_lit",
            data: { lantern_id: nearest.id }
          });

          // Check win condition
          const allLit = this.lanterns.every((l) => l.lit);
          if (allLit) {
            this.state = "won";
            this.score += Math.floor(Math.max(0, this.time_left_s) * this.tuning.score.per_second_left);
            this.score += this.player.flames * this.tuning.score.per_flame_left;
            events.push({
              type: "event",
              tick: currentTick,
              name: "game_over",
              data: { result: "won", reason: "all_lit" }
            });
          }
        }
      }
    }

    // 4. Pulse
    if (pulseTriggered && this.state === "playing") {
      if (this.player.carried >= this.tuning.pulse_cost && this.pulse_cooldown <= 0) {
        this.player.carried -= this.tuning.pulse_cost;
        this.pulse_cooldown = this.tuning.pulse_cooldown_s;
        const stunned_ids = [];

        for (const shade of this.shades) {
          const d = Math.hypot(shade.pos[0] - this.player.pos[0], shade.pos[2] - this.player.pos[2]);
          if (d <= this.tuning.pulse_radius) {
            shade.state = "stunned";
            shade.stun_timer = this.tuning.pulse_stun_s;
            stunned_ids.push(shade.id);
            this.score += this.tuning.score.per_stun;

            // Push shade back
            if (d > 0.001) {
              const pushX = (shade.pos[0] - this.player.pos[0]) / d;
              const pushZ = (shade.pos[2] - this.player.pos[2]) / d;
              shade.pos[0] += pushX * this.tuning.pulse_push_m;
              shade.pos[2] += pushZ * this.tuning.pulse_push_m;
            } else {
              shade.pos[0] += this.tuning.pulse_push_m;
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
    }

    // 5. Shades update & Hit check
    if (this.state === "playing") {
      const litLanterns = this.lanterns.filter((l) => l.lit);

      for (const shade of this.shades) {
        if (shade.state === "stunned") {
          shade.stun_timer -= dt;
          if (shade.stun_timer <= 0) {
            shade.state = "chase";
            shade.stun_timer = 0;
          }
        } else if (shade.state === "chase") {
          const dx = this.player.pos[0] - shade.pos[0];
          const dz = this.player.pos[2] - shade.pos[2];
          const dist = Math.hypot(dx, dz);

          if (dist > 0.001) {
            let nextX = shade.pos[0] + (dx / dist) * this.tuning.shade_speed * dt;
            let nextZ = shade.pos[2] + (dz / dist) * this.tuning.shade_speed * dt;

            // Safe zone check around lit lanterns
            let inSafeZone = false;
            for (const lantern of litLanterns) {
              const currentDist = Math.hypot(shade.pos[0] - lantern.pos[0], shade.pos[2] - lantern.pos[2]);
              const nextDist = Math.hypot(nextX - lantern.pos[0], nextZ - lantern.pos[2]);

              if (currentDist >= this.tuning.safe_radius && nextDist < this.tuning.safe_radius) {
                inSafeZone = true;
                break;
              }
              if (currentDist < this.tuning.safe_radius) {
                const repelX = shade.pos[0] - lantern.pos[0] || 1;
                const repelZ = shade.pos[2] - lantern.pos[2] || 0;
                const rLen = Math.hypot(repelX, repelZ) || 1;
                nextX = shade.pos[0] + (repelX / rLen) * this.tuning.shade_speed * dt;
                nextZ = shade.pos[2] + (repelZ / rLen) * this.tuning.shade_speed * dt;
                break;
              }
            }

            if (!inSafeZone) {
              shade.pos[0] = nextX;
              shade.pos[2] = nextZ;
            }
          }

          // Check hit on player
          const distToPlayer = Math.hypot(shade.pos[0] - this.player.pos[0], shade.pos[2] - this.player.pos[2]);
          if (distToPlayer <= this.tuning.shade_hit_radius && this.player.invuln_timer <= 0) {
            this.player.flames -= 1;
            this.player.invuln_timer = this.tuning.invuln_s;
            const dropped = Math.floor(this.player.carried * this.tuning.hit_drop_ratio);
            this.player.carried -= dropped;

            events.push({
              type: "event",
              tick: currentTick,
              name: "player_hit",
              data: {
                by: "shade",
                flames: this.player.flames,
                dropped
              }
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
    }

    // 6. Timers
    if (this.pulse_cooldown > 0) {
      this.pulse_cooldown -= dt;
    }
    if (this.player.invuln_timer > 0) {
      this.player.invuln_timer -= dt;
    }

    this.time_left_s = Math.max(0, this.initial_time_left_s - this.sim_tick / 60);
    if (this.time_left_s <= 0 && this.state === "playing") {
      this.time_left_s = 0;
      this.state = "lost";
      events.push({
        type: "event",
        tick: currentTick,
        name: "game_over",
        data: { result: "lost", reason: "dawn" }
      });
    }

    this.prev_input = input;
    return events;
  }

  getSnapshot() {
    return {
      type: "snapshot",
      tick: this.sim_tick,
      sim_tick: this.sim_tick,
      state: this.state,
      time_left_s: round3(Math.max(0, this.time_left_s)),
      score: this.score,
      player: {
        pos: [round3(this.player.pos[0]), round3(this.player.pos[1]), round3(this.player.pos[2])],
        flames: this.player.flames,
        carried: this.player.carried
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
