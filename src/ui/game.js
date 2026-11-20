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
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e1a);
scene.fog = new THREE.FogExp2(0x0a0e1a, 0.015);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);

// Lighting
const ambientLight = new THREE.AmbientLight(0x2a3350, 0.9);
scene.add(ambientLight);

const moonLight = new THREE.DirectionalLight(0x7ea0d0, 0.8);
moonLight.position.set(20, 60, 30);
moonLight.castShadow = true;
moonLight.shadow.mapSize.width = 1024;
moonLight.shadow.mapSize.height = 1024;
scene.add(moonLight);

// --- World Mesh: Circular Island ---
const islandRadius = 38;
const islandGeom = new THREE.CylinderGeometry(islandRadius, islandRadius + 2, 4, 64);
const islandMat = new THREE.MeshStandardMaterial({
  color: 0x1d2924,
  roughness: 0.85,
  metalness: 0.1
});
const islandMesh = new THREE.Mesh(islandGeom, islandMat);
islandMesh.position.y = -2;
islandMesh.receiveShadow = true;
scene.add(islandMesh);

// Cobblestone border ring
const borderGeom = new THREE.RingGeometry(islandRadius - 1.2, islandRadius + 0.3, 64);
const borderMat = new THREE.MeshBasicMaterial({ color: 0x2b3e34, side: THREE.DoubleSide });
const borderMesh = new THREE.Mesh(borderGeom, borderMat);
borderMesh.rotation.x = -Math.PI / 2;
borderMesh.position.y = 0.02;
scene.add(borderMesh);

// Starfield particles in background
const starCount = 300;
const starGeom = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  starPositions[i] = (Math.random() - 0.5) * 200;
  starPositions[i + 1] = 20 + Math.random() * 80;
  starPositions[i + 2] = (Math.random() - 0.5) * 200;
}
starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({ color: 0xf0f4ff, size: 0.8, transparent: true, opacity: 0.8 });
const starField = new THREE.Points(starGeom, starMat);
scene.add(starField);

// --- Player (Mây) Mesh ---
const playerGroup = new THREE.Group();

// Tunic / Body
const bodyGeom = new THREE.CylinderGeometry(0.35, 0.5, 1.2, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a7c8c, roughness: 0.6 });
const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
bodyMesh.position.y = 0.6;
bodyMesh.castShadow = true;
playerGroup.add(bodyMesh);

// Head
const headGeom = new THREE.SphereGeometry(0.28, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b0, roughness: 0.7 });
const headMesh = new THREE.Mesh(headGeom, headMat);
headMesh.position.y = 1.35;
headMesh.castShadow = true;
playerGroup.add(headMesh);

// Conical Hat (Nón Lá)
const hatGeom = new THREE.ConeGeometry(0.85, 0.38, 24);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xd4b06a, roughness: 0.9 });
const hatMesh = new THREE.Mesh(hatGeom, hatMat);
hatMesh.position.y = 1.58;
hatMesh.castShadow = true;
playerGroup.add(hatMesh);

// Small Lantern hanging from Mây's belt/hat
const pLanternGeom = new THREE.BoxGeometry(0.18, 0.25, 0.18);
const pLanternMat = new THREE.MeshStandardMaterial({
  color: 0xffbb44,
  emissive: 0xffaa22,
  emissiveIntensity: 0.8
});
const pLanternMesh = new THREE.Mesh(pLanternGeom, pLanternMat);
pLanternMesh.position.set(0.35, 0.65, 0.2);
playerGroup.add(pLanternMesh);

const pLight = new THREE.PointLight(0xffb040, 1.5, 7);
pLight.position.set(0.35, 0.65, 0.2);
playerGroup.add(pLight);

scene.add(playerGroup);

// --- Lanterns (Đèn Lồng Lớn) ---
const lanternMeshes = new Map();
function createLanternMesh(lanternData) {
  const group = new THREE.Group();
  group.position.set(lanternData.pos[0], 0, lanternData.pos[2]);

  // Stone base
  const baseGeom = new THREE.CylinderGeometry(0.8, 1.0, 0.6, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x404852, roughness: 0.9 });
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  baseMesh.position.y = 0.3;
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // Wooden pillar
  const pillarGeom = new THREE.CylinderGeometry(0.15, 0.18, 1.8, 8);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.8 });
  const pillarMesh = new THREE.Mesh(pillarGeom, woodMat);
  pillarMesh.position.y = 1.4;
  pillarMesh.castShadow = true;
  group.add(pillarMesh);

  // Large Paper Lantern Core
  const coreGeom = new THREE.CylinderGeometry(0.65, 0.65, 1.1, 12);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x33261a,
    emissive: 0x000000,
    roughness: 0.5
  });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  coreMesh.position.y = 2.4;
  group.add(coreMesh);

  // Pagoda Roof
  const roofGeom = new THREE.ConeGeometry(1.2, 0.6, 6);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x8a3324, roughness: 0.7 });
  const roofMesh = new THREE.Mesh(roofGeom, roofMat);
  roofMesh.position.y = 3.2;
  roofMesh.castShadow = true;
  group.add(roofMesh);

  // Point light for lantern
  const light = new THREE.PointLight(0xffa520, 0, 16);
  light.position.set(0, 2.5, 0);
  group.add(light);

  scene.add(group);
  lanternMeshes.set(lanternData.id, { group, coreMesh, light });
}

// --- Motes (Đom Đóm) ---
const moteMeshes = new Map();
const moteGeom = new THREE.SphereGeometry(0.2, 12, 12);
const moteMat = new THREE.MeshBasicMaterial({ color: 0xffea55 });

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
    const bob = Math.sin(Date.now() * 0.005 + m.pos[0]) * 0.25;
    mesh.position.set(m.pos[0], 0.7 + bob, m.pos[2]);
  }
}

// --- Shades (Bóng Mực) ---
const shadeMeshes = new Map();
const shadeGeom = new THREE.SphereGeometry(0.65, 16, 16);
const eyeGeom = new THREE.SphereGeometry(0.08, 8, 8);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff1133 });

function createShadeMesh(id) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x090514,
    roughness: 0.3,
    emissive: 0x1f0b38,
    emissiveIntensity: 0.6
  });
  const body = new THREE.Mesh(shadeGeom, mat);
  body.castShadow = true;
  group.add(body);

  // Red glowing eyes
  const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
  eyeL.position.set(-0.2, 0.15, 0.55);
  group.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
  eyeR.position.set(0.2, 0.15, 0.55);
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
    const hover = Math.sin(Date.now() * 0.007 + s.pos[2]) * 0.15;
    group.position.set(s.pos[0], 0.8 + hover, s.pos[2]);

    if (s.state === 'stunned') {
      group.rotation.y += 0.1;
      group.scale.set(0.7, 0.7, 0.7);
    } else {
      group.scale.set(1.0, 1.0, 1.0);
      group.lookAt(playerGroup.position.x, 0.8, playerGroup.position.z);
    }
  }
}

// --- Pulse Wave Ring Visual ---
const pulseRingGeom = new THREE.RingGeometry(0.1, 0.4, 32);
const pulseRingMat = new THREE.MeshBasicMaterial({
  color: 0xffdd44,
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
    m.coreMesh.material.emissive.setHex(0x000000);
    m.light.intensity = 0;
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
          lMesh.coreMesh.material.emissive.setHex(0xffaa22);
          lMesh.coreMesh.material.emissiveIntensity = 1.0;
          lMesh.light.intensity = 2.5;
        }
      } else if (ev.name === 'pulse') {
        sounds.playPulse();
        triggerPulseVisual(engine.player.pos);
      } else if (ev.name === 'player_hit') {
        sounds.playHit();
        // Camera shake or player flash
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
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, playerGroup.position.y + 7.5, 0.08);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, playerGroup.position.z - 11.0, 0.08);
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
  document.getElementById('modal-title').style.color = won ? '#f6e05e' : '#fc8181';
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
