// 3D Game UI implementation for Đảo Đèn Lồng using Three.js
import * as THREE from 'three';
import { GameEngine, DEFAULT_TUNING } from '../core/engine.js';

// --- Sound Synthesizer (Web Audio API - Zero Asset Dependency) ---
class SoundSynth {
  constructor() {
    this.ctx = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playPickup() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playDeposit() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playLanternLit() {
    this.ensureContext();
    if (!this.ctx) return;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C major
    const now = this.ctx.currentTime;

    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.2, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.65);
    });
  }

  playPulse() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.35);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playHit() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playWin() {
    this.ensureContext();
    if (!this.ctx) return;
    const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    melody.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }, i * 140);
    });
  }

  playLose() {
    this.ensureContext();
    if (!this.ctx) return;
    const notes = [300, 240, 180, 120];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }, i * 180);
    });
  }
}

const sounds = new SoundSynth();

// --- Three.js Setup ---
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a); // Deep night navy blue
scene.fog = new THREE.Fog(0x0f172a, 30, 95);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
// Position camera properly behind and above player at start
camera.position.set(0, 10, -14);
camera.lookAt(0, 1.2, 0);

// Lighting: bright enough to see the island, characters, and lanterns clearly
const hemiLight = new THREE.HemisphereLight(0xcfd8dc, 0x1e293b, 1.3);
scene.add(hemiLight);

const moonLight = new THREE.DirectionalLight(0xe0f2fe, 1.6);
moonLight.position.set(30, 60, 30);
scene.add(moonLight);

// --- World Mesh: Circular Island ---
const islandRadius = 38;
const islandGroup = new THREE.Group();

// Grassy top disk
const grassGeom = new THREE.CylinderGeometry(islandRadius, islandRadius, 0.6, 64);
const grassMat = new THREE.MeshStandardMaterial({
  color: 0x236b3b, // Lush emerald green
  roughness: 0.8,
  metalness: 0.1
});
const grassMesh = new THREE.Mesh(grassGeom, grassMat);
grassMesh.position.y = -0.3;
islandGroup.add(grassMesh);

// Stone border ring
const borderGeom = new THREE.RingGeometry(islandRadius - 1.2, islandRadius + 0.2, 64);
const borderMat = new THREE.MeshStandardMaterial({ color: 0x64748b, side: THREE.DoubleSide, roughness: 0.9 });
const borderMesh = new THREE.Mesh(borderGeom, borderMat);
borderMesh.rotation.x = -Math.PI / 2;
borderMesh.position.y = 0.02;
islandGroup.add(borderMesh);

// Under-island cliff base
const cliffGeom = new THREE.CylinderGeometry(islandRadius, islandRadius * 0.7, 6, 32);
const cliffMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.95 });
const cliffMesh = new THREE.Mesh(cliffGeom, cliffMat);
cliffMesh.position.y = -3.3;
islandGroup.add(cliffMesh);

scene.add(islandGroup);

// Starfield particles in background
const starCount = 400;
const starGeom = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  starPositions[i] = (Math.random() - 0.5) * 220;
  starPositions[i + 1] = 15 + Math.random() * 85;
  starPositions[i + 2] = (Math.random() - 0.5) * 220;
}
starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({ color: 0xfef08a, size: 0.9, transparent: true, opacity: 0.85 });
const starField = new THREE.Points(starGeom, starMat);
scene.add(starField);

// --- Player (Mây) Mesh ---
const playerGroup = new THREE.Group();

// Tunic / Body (Bright sky blue)
const bodyGeom = new THREE.CylinderGeometry(0.38, 0.52, 1.2, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
bodyMesh.position.y = 0.6;
playerGroup.add(bodyMesh);

// Head
const headGeom = new THREE.SphereGeometry(0.3, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 });
const headMesh = new THREE.Mesh(headGeom, headMat);
headMesh.position.y = 1.35;
playerGroup.add(headMesh);

// Conical Hat (Nón Lá) - Golden Straw
const hatGeom = new THREE.ConeGeometry(0.9, 0.4, 24);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.85 });
const hatMesh = new THREE.Mesh(hatGeom, hatMat);
hatMesh.position.y = 1.6;
playerGroup.add(hatMesh);

// Hanging Lantern on Mây's side
const pLanternGeom = new THREE.BoxGeometry(0.2, 0.28, 0.2);
const pLanternMat = new THREE.MeshStandardMaterial({
  color: 0xfef08a,
  emissive: 0xf59e0b,
  emissiveIntensity: 1.2
});
const pLanternMesh = new THREE.Mesh(pLanternGeom, pLanternMat);
pLanternMesh.position.set(0.4, 0.65, 0.2);
playerGroup.add(pLanternMesh);

const pLight = new THREE.PointLight(0xf59e0b, 3.0, 14);
pLight.position.set(0.4, 0.65, 0.2);
playerGroup.add(pLight);

scene.add(playerGroup);

// --- Lanterns (5 Đèn Lồng Lớn) ---
const lanternMeshes = new Map();
function createLanternMesh(lanternData) {
  const group = new THREE.Group();
  group.position.set(lanternData.pos[0], 0, lanternData.pos[2]);

  // Stone base pedestal
  const baseGeom = new THREE.CylinderGeometry(1.0, 1.2, 0.6, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  baseMesh.position.y = 0.3;
  group.add(baseMesh);

  // Lacquer Red Pillars
  const pillarGeom = new THREE.CylinderGeometry(0.18, 0.2, 2.0, 8);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
  const pillarMesh = new THREE.Mesh(pillarGeom, woodMat);
  pillarMesh.position.y = 1.5;
  group.add(pillarMesh);

  // Large Paper Lantern Core
  const coreGeom = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 16);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xb45309,
    emissiveIntensity: 0.6, // Warm dormant glow even unlit so player sees it
    roughness: 0.4
  });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  coreMesh.position.y = 2.5;
  group.add(coreMesh);

  // Pagoda Tiered Roof
  const roofGeom = new THREE.ConeGeometry(1.4, 0.7, 6);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.6 });
  const roofMesh = new THREE.Mesh(roofGeom, roofMat);
  roofMesh.position.y = 3.35;
  group.add(roofMesh);

  // Point light for lantern
  const light = new THREE.PointLight(0xf59e0b, 0.8, 12);
  light.position.set(0, 2.6, 0);
  group.add(light);

  scene.add(group);
  lanternMeshes.set(lanternData.id, { group, coreMesh, light });
}

// --- Motes (Đom Đóm) ---
const moteMeshes = new Map();
const moteGeom = new THREE.SphereGeometry(0.35, 12, 12);
const moteMat = new THREE.MeshStandardMaterial({
  color: 0xfef08a,
  emissive: 0xfacc15,
  emissiveIntensity: 1.5,
  roughness: 0.2
});

function updateMoteMeshes(motesList) {
  const currentIds = new Set(motesList.map((m) => m.id));

  // Remove stale motes
  for (const [id, mesh] of moteMeshes) {
    if (!currentIds.has(id)) {
      scene.remove(mesh);
      moteMeshes.delete(id);
    }
  }

  // Add / update motes
  for (const m of motesList) {
    let mesh = moteMeshes.get(m.id);
    if (!mesh) {
      mesh = new THREE.Mesh(moteGeom, moteMat);
      scene.add(mesh);
      moteMeshes.set(m.id, mesh);
    }
    const bob = Math.sin(Date.now() * 0.005 + m.pos[0]) * 0.3;
    mesh.position.set(m.pos[0], 0.8 + bob, m.pos[2]);
  }
}

// --- Shades (Bóng Mực) ---
const shadeMeshes = new Map();
const shadeGeom = new THREE.SphereGeometry(0.7, 16, 16);
const eyeGeom = new THREE.SphereGeometry(0.1, 8, 8);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

function createShadeMesh(id) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.4,
    emissive: 0x3b0764,
    emissiveIntensity: 0.8
  });
  const body = new THREE.Mesh(shadeGeom, mat);
  group.add(body);

  // Red glowing eyes
  const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
  eyeL.position.set(-0.22, 0.15, 0.6);
  group.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
  eyeR.position.set(0.22, 0.15, 0.6);
  group.add(eyeR);

  scene.add(group);
  return group;
}

function updateShadeMeshes(shadesList) {
  const currentIds = new Set(shadesList.map((s) => s.id));
  for (const [id, group] of shadeMeshes) {
    if (!currentIds.has(id)) {
      scene.remove(group);
      shadeMeshes.delete(id);
    }
  }

  for (const s of shadesList) {
    let group = shadeMeshes.get(s.id);
    if (!group) {
      group = createShadeMesh(s.id);
      shadeMeshes.set(s.id, group);
    }
    const hover = Math.sin(Date.now() * 0.007 + s.pos[2]) * 0.18;
    group.position.set(s.pos[0], 0.85 + hover, s.pos[2]);

    if (s.state === 'stunned') {
      group.rotation.y += 0.12;
      group.scale.set(0.7, 0.7, 0.7);
    } else {
      group.scale.set(1.0, 1.0, 1.0);
      group.lookAt(playerGroup.position.x, 0.85, playerGroup.position.z);
    }
  }
}

// --- Pulse Wave Ring Visual ---
const pulseRingGeom = new THREE.RingGeometry(0.1, 0.5, 32);
const pulseRingMat = new THREE.MeshBasicMaterial({
  color: 0xfde047,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0
});
const pulseRingMesh = new THREE.Mesh(pulseRingGeom, pulseRingMat);
pulseRingMesh.rotation.x = -Math.PI / 2;
scene.add(pulseRingMesh);

let pulseAnimProgress = 1;
function triggerPulseVisual(pos) {
  pulseRingMesh.position.set(pos[0], 0.1, pos[2]);
  pulseAnimProgress = 0;
}

// --- Input Tracker ---
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  space: false,
  e: false,
  q: false
};

window.addEventListener('keydown', (e) => {
  sounds.ensureContext();
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') keys.w = true;
  if (k === 's' || k === 'arrowdown') keys.s = true;
  if (k === 'a' || k === 'arrowleft') keys.a = true;
  if (k === 'd' || k === 'arrowright') keys.d = true;
  if (k === ' ') keys.space = true;
  if (k === 'e') keys.e = true;
  if (k === 'q' || k === 'f') keys.q = true;
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'arrowup') keys.w = false;
  if (k === 's' || k === 'arrowdown') keys.s = false;
  if (k === 'a' || k === 'arrowleft') keys.a = false;
  if (k === 'd' || k === 'arrowright') keys.d = false;
  if (k === ' ') keys.space = false;
  if (k === 'e') keys.e = false;
  if (k === 'q' || k === 'f') keys.q = false;
});

// --- Initialize Engine ---
let engine = new GameEngine({ seed: Date.now() % 100000 });
for (const lantern of engine.lanterns) {
  createLanternMesh(lantern);
}

// --- Restart Game ---
document.getElementById('btn-play-again').addEventListener('click', () => {
  document.getElementById('end-modal').style.display = 'none';
  engine = new GameEngine({ seed: Date.now() % 100000 });
  for (const [id, m] of lanternMeshes) {
    m.coreMesh.material.emissive.setHex(0xb45309);
    m.coreMesh.material.emissiveIntensity = 0.6;
    m.light.intensity = 0.8;
  }
});

// --- Main Game Loop (60 Ticks Fixed Step) ---
let lastTime = performance.now();
const tickIntervalMs = 1000 / 60;
let accumulator = 0;

function animate(currentTime) {
  requestAnimationFrame(animate);

  const delta = Math.min(currentTime - lastTime, 100);
  lastTime = currentTime;
  accumulator += delta;

  while (accumulator >= tickIntervalMs) {
    accumulator -= tickIntervalMs;

    // Build input frame from keys
    let mx = 0;
    let mz = 0;
    if (keys.w) mz += 1;
    if (keys.s) mz -= 1;
    if (keys.d) mx += 1;
    if (keys.a) mx -= 1;

    const input = {
      move: [mx, mz],
      cam_yaw_deg: 0,
      jump: keys.space,
      interact: keys.e,
      pulse: keys.q
    };

    // Step engine
    const events = engine.step(input);

    // Handle events for visual/audio effects
    for (const ev of events) {
      if (ev.name === 'mote_picked') {
        sounds.playPickup();
      } else if (ev.name === 'deposit') {
        sounds.playDeposit();
      } else if (ev.name === 'lantern_lit') {
        sounds.playLanternLit();
        const lMesh = lanternMeshes.get(ev.data.lantern_id);
        if (lMesh) {
          lMesh.coreMesh.material.emissive.setHex(0xf59e0b);
          lMesh.coreMesh.material.emissiveIntensity = 2.5;
          lMesh.light.intensity = 5.0;
          lMesh.light.distance = 28;
        }
      } else if (ev.name === 'pulse') {
        sounds.playPulse();
        triggerPulseVisual(engine.player.pos);
      } else if (ev.name === 'player_hit') {
        sounds.playHit();
      } else if (ev.name === 'game_over') {
        if (ev.data.result === 'won') {
          sounds.playWin();
          showGameOverModal(true, 'CHIẾN THẮNG!', 'Mây đã thắp sáng tất cả Đèn Lồng, xua tan sương đen cứu lấy đảo!');
        } else {
          sounds.playLose();
          const reasonMsg = ev.data.reason === 'dawn' ? 'Bình minh đã đến trước khi kịp thắp đèn!' : 'Mây đã mất hết ngọn lửa!';
          showGameOverModal(false, 'THẤT BẠI!', reasonMsg);
        }
      }
    }
  }

  // Update 3D Visual Positions
  playerGroup.position.set(engine.player.pos[0], engine.player.pos[1], engine.player.pos[2]);

  // Turn player towards move direction
  if (keys.w || keys.s || keys.a || keys.d) {
    let targetAngle = 0;
    if (keys.w && !keys.a && !keys.d) targetAngle = 0;
    else if (keys.s && !keys.a && !keys.d) targetAngle = Math.PI;
    else if (keys.d && !keys.w && !keys.s) targetAngle = Math.PI / 2;
    else if (keys.a && !keys.w && !keys.s) targetAngle = -Math.PI / 2;
    else if (keys.w && keys.d) targetAngle = Math.PI / 4;
    else if (keys.w && keys.a) targetAngle = -Math.PI / 4;
    else if (keys.s && keys.d) targetAngle = (3 * Math.PI) / 4;
    else if (keys.s && keys.a) targetAngle = (-3 * Math.PI) / 4;
    playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, targetAngle, 0.2);
  }

  // Smooth 3rd-person Camera Follow
  const camTargetX = playerGroup.position.x;
  const camTargetY = playerGroup.position.y + 1.2;
  const camTargetZ = playerGroup.position.z;
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerGroup.position.x, 0.08);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, playerGroup.position.y + 8.5, 0.08);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, playerGroup.position.z - 12.0, 0.08);
  camera.lookAt(camTargetX, camTargetY, camTargetZ);

  // Update Motes and Shades
  updateMoteMeshes(engine.motes);
  updateShadeMeshes(engine.shades);

  // Animate Pulse Wave
  if (pulseAnimProgress < 1) {
    pulseAnimProgress += 0.04;
    const currentR = pulseAnimProgress * engine.tuning.pulse_radius;
    pulseRingMesh.scale.set(currentR, currentR, 1);
    pulseRingMat.opacity = Math.max(0, 1 - pulseAnimProgress);
  } else {
    pulseRingMat.opacity = 0;
  }

  // Update HUD
  updateHUD();

  renderer.render(scene, camera);
}

function updateHUD() {
  document.getElementById('hud-time').textContent = `${Math.ceil(engine.time_left_s)}s`;
  document.getElementById('hud-score').textContent = engine.score;

  const litCount = engine.lanterns.filter((l) => l.lit).length;
  document.getElementById('hud-lanterns').textContent = `${litCount} / 5 Đèn`;

  // Flames
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`flame-${i}`);
    if (el) {
      if (i <= engine.player.flames) el.classList.remove('lost');
      else el.classList.add('lost');
    }
  }

  // Carried Motes
  document.getElementById('carried-count').textContent = `${engine.player.carried}/5`;
  const dots = document.querySelectorAll('.mote-dot');
  dots.forEach((dot, idx) => {
    if (idx < engine.player.carried) dot.classList.add('filled');
    else dot.classList.remove('filled');
  });
}

function showGameOverModal(won, title, subtitle) {
  const modal = document.getElementById('end-modal');
  modal.style.display = 'flex';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-title').style.color = won ? '#fde047' : '#ef4444';
  document.getElementById('modal-subtitle').textContent = subtitle;
  document.getElementById('modal-score-val').textContent = engine.score;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start loop
requestAnimationFrame(animate);
