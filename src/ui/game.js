// 3D Game UI implementation for Đảo Đèn Lồng (Phase 2: Ba Hòn Đảo) using Three.js
import * as THREE from 'three';
import { GameEngine, DEFAULT_TUNING } from '../core/engine.js';

// --- Sound Synthesizer (Web Audio API) ---
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

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  playPickup() { this.playTone(987.77, 'sine', 0.12, 0.25); }
  playDeposit() { this.playTone(659.25, 'triangle', 0.18, 0.3); }
  playLanternLit() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.5, 0.2), i * 60);
    });
  }
  playPulse() { this.playTone(320, 'sawtooth', 0.35, 0.35); }
  playHit() { this.playTone(110, 'square', 0.25, 0.4); }
  playDash() { this.playTone(480, 'triangle', 0.15, 0.25); }
  playJump() { this.playTone(400, 'sine', 0.15, 0.2); }
  playCharm() {
    [880, 1174.66, 1760].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 0.3, 0.25), i * 70));
  }
  playWin() {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.4, 0.3), i * 140);
    });
  }
  playLose() {
    [320, 260, 200, 140].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sawtooth', 0.35, 0.25), i * 160);
    });
  }
}

const sounds = new SoundSynth();

// --- Colorblind Mode Setup ---
let isColorblind = localStorage.getItem('colorblind_mode') === 'true';
const btnColorblind = document.getElementById('btn-colorblind');
function applyColorblindMode() {
  document.body.classList.toggle('colorblind-mode', isColorblind);
  if (btnColorblind) {
    btnColorblind.textContent = isColorblind ? '👁 Bảng màu: Dễ nhìn' : '👁 Bảng màu: Chuẩn';
    btnColorblind.style.borderColor = isColorblind ? '#00B3FF' : '#5B5F6E';
  }
}
applyColorblindMode();
if (btnColorblind) {
  btnColorblind.addEventListener('click', () => {
    isColorblind = !isColorblind;
    localStorage.setItem('colorblind_mode', isColorblind ? 'true' : 'false');
    applyColorblindMode();
  });
}

// --- Three.js Setup ---
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0E1430);
scene.fog = new THREE.Fog(0x0E1430, 35, 110);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 11, -15);
camera.lookAt(0, 1.2, 0);

// Lighting
const hemiLight = new THREE.HemisphereLight(0x8fa3b8, 0x1B2350, 0.7);
scene.add(hemiLight);

const moonLight = new THREE.DirectionalLight(0xdbeafe, 1.2);
moonLight.position.set(30, 60, 30);
scene.add(moonLight);

// Cloud Sea floor (Y = -12)
const seaGeom = new THREE.PlaneGeometry(350, 350, 8, 8);
const seaMat = new THREE.MeshBasicMaterial({ color: 0x12384A, side: THREE.DoubleSide });
const seaMesh = new THREE.Mesh(seaGeom, seaMat);
seaMesh.rotation.x = -Math.PI / 2;
seaMesh.position.y = -12;
scene.add(seaMesh);

// Starfield particles in background
const starCount = 450;
const starGeom = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i += 3) {
  starPositions[i] = (Math.random() - 0.5) * 260;
  starPositions[i + 1] = 15 + Math.random() * 95;
  starPositions[i + 2] = (Math.random() - 0.5) * 260;
}
starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMat = new THREE.PointsMaterial({ color: 0xFFE9B0, size: 0.9, transparent: true, opacity: 0.85 });
const starField = new THREE.Points(starGeom, starMat);
scene.add(starField);

// --- World Mesh Container ---
let worldMeshGroup = new THREE.Group();
scene.add(worldMeshGroup);

function buildWorldMeshes(night) {
  scene.remove(worldMeshGroup);
  worldMeshGroup = new THREE.Group();

  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2F5D50, roughness: 0.8 });
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xC9B48A, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6B4A2F, roughness: 0.8 });

  if (night === 1) {
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(40, 40, 4, 64), grassMat);
    disk.position.y = -2;
    worldMeshGroup.add(disk);
  } else if (night === 2) {
    // Island A at (0, 0)
    const diskA = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 4, 48), grassMat);
    diskA.position.set(0, -2, 0);
    worldMeshGroup.add(diskA);

    // Island B at (70, 0)
    const diskB = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 4, 48), grassMat);
    diskB.position.set(70, -2, 0);
    worldMeshGroup.add(diskB);

    // Bamboo bridge x in [26, 44], z in [-2, 2]
    const bridgeGeom = new THREE.BoxGeometry(18, 0.4, 4);
    const bridge = new THREE.Mesh(bridgeGeom, woodMat);
    bridge.position.set(35, -0.2, 0);
    worldMeshGroup.add(bridge);

    // Jump pads at (20, 0, 18) and (50, 0, -18)
    const padGeom = new THREE.CylinderGeometry(1.0, 1.1, 0.2, 24);
    const padMat = new THREE.MeshStandardMaterial({ color: 0xF2C14E, emissive: 0xd97706, emissiveIntensity: 0.8 });
    const pad1 = new THREE.Mesh(padGeom, padMat);
    pad1.position.set(20, 0.1, 18);
    worldMeshGroup.add(pad1);

    const pad2 = new THREE.Mesh(padGeom, padMat);
    pad2.position.set(50, 0.1, -18);
    worldMeshGroup.add(pad2);
  } else if (night === 3) {
    // Tier 0: R=45, Y=0
    const t0 = new THREE.Mesh(new THREE.CylinderGeometry(45, 45, 4, 64), grassMat);
    t0.position.y = -2;
    worldMeshGroup.add(t0);

    // Tier 1: Y=3, ring R in [12, 24] with z > 0
    const t1Geom = new THREE.CylinderGeometry(24, 24, 3, 32, 1, false, 0, Math.PI);
    const t1 = new THREE.Mesh(t1Geom, sandMat);
    t1.position.set(0, 1.5, 0);
    t1.rotation.y = -Math.PI / 2;
    worldMeshGroup.add(t1);

    // Tier 2: Y=6, disk R <= 8 at center
    const t2 = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 3, 32), grassMat);
    t2.position.set(0, 4.5, 0);
    worldMeshGroup.add(t2);

    // Bell Tower at center: Cylinder R=2m, height 8m (Y from 6 to 14)
    const towerGeom = new THREE.CylinderGeometry(2, 2.2, 8, 16);
    const tower = new THREE.Mesh(towerGeom, woodMat);
    tower.position.set(0, 10, 0);
    worldMeshGroup.add(tower);

    // Jump pad on Tier 1 at (0, 3, 13)
    const padGeom = new THREE.CylinderGeometry(1.0, 1.1, 0.2, 24);
    const padMat = new THREE.MeshStandardMaterial({ color: 0xF2C14E, emissive: 0xd97706, emissiveIntensity: 0.8 });
    const pad3 = new THREE.Mesh(padGeom, padMat);
    pad3.position.set(0, 3.1, 13);
    worldMeshGroup.add(pad3);
  }

  scene.add(worldMeshGroup);
}

// --- Player (Mây) Mesh ---
const playerGroup = new THREE.Group();

// Tunic / Body: #E8E2D0
const bodyGeom = new THREE.CylinderGeometry(0.38, 0.52, 1.2, 16);
const bodyMat = new THREE.MeshStandardMaterial({ color: 0xE8E2D0, roughness: 0.6 });
const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
bodyMesh.position.y = 0.6;
playerGroup.add(bodyMesh);

// Scarf: #C8102E
const scarfGeom = new THREE.TorusGeometry(0.36, 0.08, 8, 16);
const scarfMat = new THREE.MeshStandardMaterial({ color: 0xC8102E, roughness: 0.7 });
const scarfMesh = new THREE.Mesh(scarfGeom, scarfMat);
scarfMesh.position.y = 1.15;
scarfMesh.rotation.x = Math.PI / 2;
playerGroup.add(scarfMesh);

// Head
const headGeom = new THREE.SphereGeometry(0.3, 16, 16);
const headMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.6 });
const headMesh = new THREE.Mesh(headGeom, headMat);
headMesh.position.y = 1.35;
playerGroup.add(headMesh);

// Conical Hat (Nón Lá): #C9B48A
const hatGeom = new THREE.ConeGeometry(0.9, 0.4, 24);
const hatMat = new THREE.MeshStandardMaterial({ color: 0xC9B48A, roughness: 0.85 });
const hatMesh = new THREE.Mesh(hatGeom, hatMat);
hatMesh.position.y = 1.6;
playerGroup.add(hatMesh);

// Small Lantern on Mây's side
const pLanternGeom = new THREE.BoxGeometry(0.2, 0.28, 0.2);
const pLanternMat = new THREE.MeshStandardMaterial({
  color: 0xFFE9B0,
  emissive: 0xFFB347,
  emissiveIntensity: 1.2
});
const pLanternMesh = new THREE.Mesh(pLanternGeom, pLanternMat);
pLanternMesh.position.set(0.4, 0.65, 0.2);
playerGroup.add(pLanternMesh);

const pLight = new THREE.PointLight(0xFFB347, 3.0, 14);
pLight.position.set(0.4, 0.65, 0.2);
playerGroup.add(pLight);

scene.add(playerGroup);

// --- Lanterns ---
const lanternMeshes = new Map();
function createLanternMesh(lanternData) {
  const group = new THREE.Group();
  group.position.set(lanternData.pos[0], lanternData.pos[1] || 0, lanternData.pos[2]);

  const baseGeom = new THREE.CylinderGeometry(1.0, 1.2, 0.6, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x5B5F6E, roughness: 0.8 });
  const baseMesh = new THREE.Mesh(baseGeom, baseMat);
  baseMesh.position.y = 0.3;
  group.add(baseMesh);

  const pillarGeom = new THREE.CylinderGeometry(0.18, 0.2, 2.0, 8);
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6B4A2F, roughness: 0.7 });
  const pillarMesh = new THREE.Mesh(pillarGeom, woodMat);
  pillarMesh.position.y = 1.5;
  group.add(pillarMesh);

  // Large Paper Lantern Core: unlit #5B5F6E, lit #FFB347 / #FFE9B0
  const coreGeom = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 16);
  const coreMat = new THREE.MeshStandardMaterial({
    color: lanternData.lit ? 0xFFE9B0 : 0x5B5F6E,
    emissive: lanternData.lit ? 0xFFB347 : 0x1B2350,
    emissiveIntensity: lanternData.lit ? 2.0 : 0.2
  });
  const coreMesh = new THREE.Mesh(coreGeom, coreMat);
  coreMesh.position.y = 2.5;
  if (!lanternData.lit) {
    coreMesh.scale.set(1.0, 0.8, 1.0); // Đèn tắt bị xẹp 20%
  }
  group.add(coreMesh);

  const roofGeom = new THREE.ConeGeometry(1.4, 0.7, 6);
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x6B4A2F, roughness: 0.6 });
  const roofMesh = new THREE.Mesh(roofGeom, roofMat);
  roofMesh.position.y = 3.35;
  group.add(roofMesh);

  const light = new THREE.PointLight(0xFFB347, lanternData.lit ? 4.5 : 0.2, 25);
  light.position.set(0, 2.6, 0);
  group.add(light);

  // 3D Fuel Bar above lantern
  const fuelBarGroup = new THREE.Group();
  fuelBarGroup.position.set(0, 4.3, 0);

  const bgGeom = new THREE.BoxGeometry(1.4, 0.16, 0.08);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x1B2350 });
  const bgMesh = new THREE.Mesh(bgGeom, bgMat);
  fuelBarGroup.add(bgMesh);

  const fillGeom = new THREE.BoxGeometry(1.36, 0.12, 0.1);
  fillGeom.translate(0.68, 0, 0);
  const fillMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const fillMesh = new THREE.Mesh(fillGeom, fillMat);
  fillMesh.position.set(-0.68, 0, 0.01);
  fuelBarGroup.add(fillMesh);

  fuelBarGroup.visible = !!lanternData.lit;
  group.add(fuelBarGroup);

  scene.add(group);
  lanternMeshes.set(lanternData.id, { group, coreMesh, light, fuelBarGroup, fillMesh, fillMat });
}

function clearAllLanterns() {
  for (const [id, m] of lanternMeshes) {
    scene.remove(m.group);
  }
  lanternMeshes.clear();
}

function updateLanternVisuals() {
  const blinkOn = Math.floor(Date.now() / 500) % 2 === 0;
  for (const l of engine.lanterns) {
    const m = lanternMeshes.get(l.id);
    if (!m) continue;

    if (!l.lit) {
      m.fuelBarGroup.visible = false;
      m.coreMesh.scale.set(1.0, 0.8, 1.0); // 20% crushed when unlit
      m.coreMesh.material.color.setHex(0x5B5F6E);
      m.coreMesh.material.emissive.setHex(0x1B2350);
      m.coreMesh.material.emissiveIntensity = 0.2;
      m.light.intensity = 0.2;
    } else {
      m.fuelBarGroup.visible = true;
      m.coreMesh.scale.set(1.0, 1.0, 1.0);
      m.fuelBarGroup.quaternion.copy(camera.quaternion);

      const ratio = Math.max(0, Math.min(1, l.fuel / 100));
      m.fillMesh.scale.x = ratio;

      if (l.fuel < 30) {
        // Nhấp nháy 1 Hz khi fuel < 30
        m.light.intensity = blinkOn ? 4.5 : 1.0;
        m.coreMesh.material.color.setHex(blinkOn ? 0xFFE9B0 : 0x886633);
        m.coreMesh.material.emissive.setHex(blinkOn ? 0xFFB347 : 0x442208);
        const warnColor = isColorblind ? (blinkOn ? 0xFFFFFF : 0x00B3FF) : (blinkOn ? 0xef4444 : 0x7f1d1d);
        m.fillMat.color.setHex(warnColor);
      } else {
        m.light.intensity = 4.5;
        m.coreMesh.material.color.setHex(0xFFE9B0);
        m.coreMesh.material.emissive.setHex(0xFFB347);
        m.coreMesh.material.emissiveIntensity = 2.0;
        m.fillMat.color.setHex(isColorblind ? 0x00B3FF : 0x22c55e);
      }
    }
  }
}

// --- Motes ---
const moteMeshes = new Map();
const moteGeom = new THREE.SphereGeometry(0.35, 12, 12);
const moteMat = new THREE.MeshStandardMaterial({
  color: 0xFFF6C2,
  emissive: 0xFFE58A,
  emissiveIntensity: 1.5
});

function updateMoteMeshes(motesList) {
  const currentIds = new Set(motesList.map((m) => m.id));
  for (const [id, mesh] of moteMeshes) {
    if (!currentIds.has(id)) {
      scene.remove(mesh);
      moteMeshes.delete(id);
    }
  }

  for (const m of motesList) {
    let mesh = moteMeshes.get(m.id);
    if (!mesh) {
      mesh = new THREE.Mesh(moteGeom, moteMat);
      scene.add(mesh);
      moteMeshes.set(m.id, mesh);
    }
    const bob = Math.sin(Date.now() * 0.005 + m.pos[0]) * 0.25;
    mesh.position.set(m.pos[0], m.pos[1] + 0.8 + bob, m.pos[2]);
  }
}

// --- Shades (Bóng Mực): #120A1A, Rim: #7A3CFF, Stunned: #3A3450 ---
const shadeMeshes = new Map();
const shadeGeom = new THREE.SphereGeometry(0.7, 16, 16);
const eyeGeom = new THREE.SphereGeometry(0.1, 8, 8);
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

function createShadeMesh(id) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x120A1A,
    emissive: 0x7A3CFF,
    emissiveIntensity: 0.6,
    roughness: 0.4
  });
  const body = new THREE.Mesh(shadeGeom, mat);
  group.add(body);

  const leftEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const rightEyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const eyeL = new THREE.Mesh(eyeGeom, leftEyeMat);
  eyeL.position.set(-0.22, 0.15, 0.6);
  group.add(eyeL);

  const eyeR = new THREE.Mesh(eyeGeom, rightEyeMat);
  eyeR.position.set(0.22, 0.15, 0.6);
  group.add(eyeR);

  scene.add(group);
  return { group, body, eyeL, eyeR };
}

function updateShadeMeshes(shadesList) {
  const currentIds = new Set(shadesList.map((s) => s.id));
  for (const [id, data] of shadeMeshes) {
    if (!currentIds.has(id)) {
      scene.remove(data.group);
      shadeMeshes.delete(id);
    }
  }

  const rimColor = isColorblind ? 0x00B3FF : 0x7A3CFF;
  const eyeColor = isColorblind ? 0x00B3FF : 0xef4444;

  for (const s of shadesList) {
    let data = shadeMeshes.get(s.id);
    if (!data) {
      data = createShadeMesh(s.id);
      shadeMeshes.set(s.id, data);
    }
    const hover = Math.sin(Date.now() * 0.007 + s.pos[2]) * 0.18;
    data.group.position.set(s.pos[0], (s.pos[1] || 0) + 0.85 + hover, s.pos[2]);

    data.eyeL.material.color.setHex(eyeColor);
    data.eyeR.material.color.setHex(eyeColor);

    if (s.state === 'stunned') {
      data.body.material.color.setHex(0x3A3450);
      data.body.material.emissive.setHex(0x221A30);
      data.group.rotation.y += 0.12;
      data.group.scale.set(0.7, 0.7, 0.7);
    } else if (s.state === 'drain') {
      data.body.material.color.setHex(0x120A1A);
      data.body.material.emissive.setHex(isColorblind ? 0x00B3FF : 0xC026D3);
      data.group.scale.set(1.1, 0.9 + Math.sin(Date.now() * 0.02) * 0.1, 1.1);
      data.group.lookAt(playerGroup.position.x, playerGroup.position.y + 0.8, playerGroup.position.z);
    } else {
      data.body.material.color.setHex(0x120A1A);
      data.body.material.emissive.setHex(rimColor);
      data.group.scale.set(1.0, 1.0, 1.0);
      data.group.lookAt(playerGroup.position.x, playerGroup.position.y + 0.8, playerGroup.position.z);
    }
  }
}

// --- Drifters (Gió Lạc): #8FA3B8 ---
const drifterMeshes = new Map();
const drifterGeom = new THREE.ConeGeometry(0.5, 1.8, 12);
const drifterMat = new THREE.MeshStandardMaterial({
  color: 0x8FA3B8,
  emissive: 0x8FA3B8,
  emissiveIntensity: 0.8,
  transparent: true,
  opacity: 0.85
});

function updateDrifterMeshes(drifterList) {
  const currentIds = new Set(drifterList.map((d) => d.id));
  for (const [id, mesh] of drifterMeshes) {
    if (!currentIds.has(id)) {
      scene.remove(mesh);
      drifterMeshes.delete(id);
    }
  }

  for (const d of drifterList) {
    let mesh = drifterMeshes.get(d.id);
    if (!mesh) {
      mesh = new THREE.Mesh(drifterGeom, drifterMat);
      mesh.rotation.x = Math.PI / 2;
      scene.add(mesh);
      drifterMeshes.set(d.id, mesh);
    }
    mesh.position.set(d.pos[0], d.pos[1] || 1.8, d.pos[2]);
    mesh.rotation.z += 0.08;
  }
}

// --- Charms (Bùa Gió): #C8102E, border: #F2C14E ---
const charmMeshes = new Map();
const charmGeom = new THREE.BoxGeometry(0.6, 1.0, 0.08);
const charmMat = new THREE.MeshStandardMaterial({
  color: 0xC8102E,
  emissive: 0xF2C14E,
  emissiveIntensity: 0.8
});

function updateCharmMeshes(charmList) {
  for (const c of charmList) {
    let mesh = charmMeshes.get(c.id);
    if (!mesh) {
      mesh = new THREE.Mesh(charmGeom, charmMat);
      scene.add(mesh);
      charmMeshes.set(c.id, mesh);
    }
    mesh.visible = c.available;
    mesh.position.set(c.pos[0], c.pos[1] + 1.0 + Math.sin(Date.now() * 0.004) * 0.15, c.pos[2]);
    mesh.rotation.y += 0.03;
  }
}

// --- Pulse Wave Ring Visual ---
const pulseRingGeom = new THREE.RingGeometry(0.1, 0.5, 32);
const pulseRingMat = new THREE.MeshBasicMaterial({
  color: 0xF2C14E,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0
});
const pulseRingMesh = new THREE.Mesh(pulseRingGeom, pulseRingMat);
pulseRingMesh.rotation.x = -Math.PI / 2;
scene.add(pulseRingMesh);

let pulseAnimProgress = 1;
function triggerPulseVisual(pos) {
  pulseRingMesh.position.set(pos[0], pos[1] + 0.1, pos[2]);
  pulseAnimProgress = 0;
}

// --- Input Tracker ---
const keys = {
  w: false, a: false, s: false, d: false,
  space: false, e: false, q: false, shift: false, esc: false
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
  if (k === 'shift') keys.shift = true;
  if (k === 'escape' || k === 'p') keys.esc = true;
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
  if (k === 'shift') keys.shift = false;
  if (k === 'escape' || k === 'p') keys.esc = false;
});

// --- Engine State Management ---
let currentNight = 1;
let engine = null;

function loadNight(n) {
  currentNight = n;
  engine = new GameEngine({ seed: Date.now() % 100000, night: n });
  buildWorldMeshes(n);
  clearAllLanterns();
  for (const l of engine.lanterns) {
    createLanternMesh(l);
  }

  // Update night buttons UI
  document.querySelectorAll('.night-btn').forEach((b, idx) => {
    if (idx + 1 === n) b.classList.add('active');
    else b.classList.remove('active');
  });
}

loadNight(1);

// Level selector buttons
document.getElementById('btn-night-1').addEventListener('click', () => loadNight(1));
document.getElementById('btn-night-2').addEventListener('click', () => loadNight(2));
document.getElementById('btn-night-3').addEventListener('click', () => loadNight(3));

// Pause modal buttons
document.getElementById('btn-resume').addEventListener('click', () => {
  document.getElementById('pause-modal').style.display = 'none';
  engine.step({ pause: true });
});
document.getElementById('btn-restart-night').addEventListener('click', () => {
  document.getElementById('pause-modal').style.display = 'none';
  loadNight(currentNight);
});

// End modal buttons
document.getElementById('btn-play-again').addEventListener('click', () => {
  document.getElementById('end-modal').style.display = 'none';
  loadNight(currentNight);
});
document.getElementById('btn-next-night').addEventListener('click', () => {
  document.getElementById('end-modal').style.display = 'none';
  if (currentNight < 3) loadNight(currentNight + 1);
  else loadNight(1);
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

    let mx = 0;
    let mz = 0;
    if (keys.w) mz += 1;
    if (keys.s) mz -= 1;
    // In Three.js with camera behind player at -Z looking along +Z:
    // Screen Right corresponds to World -X, Screen Left corresponds to World +X.
    if (keys.d) mx -= 1;
    if (keys.a) mx += 1;

    const input = {
      move: [mx, mz],
      cam_yaw_deg: 0,
      jump: keys.space,
      interact: keys.e,
      pulse: keys.q,
      dash: keys.shift,
      pause: keys.esc
    };

    const events = engine.step(input);

    for (const ev of events) {
      if (ev.name === 'mote_picked') sounds.playPickup();
      else if (ev.name === 'deposit' || ev.name === 'refuel') sounds.playDeposit();
      else if (ev.name === 'lantern_out') sounds.playLose();
      else if (ev.name === 'dash') sounds.playDash();
      else if (ev.name === 'charm_picked') sounds.playCharm();
      else if (ev.name === 'lantern_lit') {
        sounds.playLanternLit();
      } else if (ev.name === 'pulse') {
        sounds.playPulse();
        triggerPulseVisual(engine.player.pos);
      } else if (ev.name === 'player_hit') {
        sounds.playHit();
      } else if (ev.name === 'paused') {
        document.getElementById('pause-modal').style.display = 'flex';
      } else if (ev.name === 'resumed') {
        document.getElementById('pause-modal').style.display = 'none';
      } else if (ev.name === 'game_over') {
        if (ev.data.result === 'won') {
          sounds.playWin();
          const subtitle = currentNight === 3
            ? 'Bình minh rực rỡ đã trở lại! Bạn đã hoàn thành xuất sắc cả 3 Đêm!'
            : `Đêm ${currentNight} bình minh tới! Bạn đã bảo vệ thành công các ngọn đèn!`;
          showGameOverModal(true, 'BÌNH MINH TOÀN THẮNG!', subtitle);
        } else {
          sounds.playLose();
          const reasonMsg = ev.data.reason === 'dawn' ? 'Bình minh đã đến nhưng số đèn sáng không đạt yêu cầu!' : 'Mây đã mất hết ngọn lửa!';
          showGameOverModal(false, 'THẤT BẠI!', reasonMsg);
        }
      }
    }
  }

  // Update 3D Positions
  playerGroup.position.set(engine.player.pos[0], engine.player.pos[1], engine.player.pos[2]);

  if (keys.w || keys.s || keys.a || keys.d) {
    let targetAngle = 0;
    if (keys.w && !keys.a && !keys.d) targetAngle = 0;
    else if (keys.s && !keys.a && !keys.d) targetAngle = Math.PI;
    else if (keys.d && !keys.w && !keys.s) targetAngle = -Math.PI / 2;
    else if (keys.a && !keys.w && !keys.s) targetAngle = Math.PI / 2;
    else if (keys.w && keys.d) targetAngle = -Math.PI / 4;
    else if (keys.w && keys.a) targetAngle = Math.PI / 4;
    else if (keys.s && keys.d) targetAngle = (-3 * Math.PI) / 4;
    else if (keys.s && keys.a) targetAngle = (3 * Math.PI) / 4;
    playerGroup.rotation.y = THREE.MathUtils.lerp(playerGroup.rotation.y, targetAngle, 0.2);
  }

  // Camera Follow
  camera.position.x = THREE.MathUtils.lerp(camera.position.x, playerGroup.position.x, 0.08);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, playerGroup.position.y + 8.5, 0.08);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, playerGroup.position.z - 12.0, 0.08);
  camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.2, playerGroup.position.z);

  // Update Dynamic Entities
  updateLanternVisuals();
  updateMoteMeshes(engine.motes);
  updateShadeMeshes(engine.shades);
  updateDrifterMeshes(engine.drifters);
  updateCharmMeshes(engine.charms);

  // Ambient light scales with lit progress: 0.15 + 0.55 * (lit / total)
  const litCount = engine.lanterns.filter((l) => l.lit).length;
  hemiLight.intensity = 0.15 + 0.55 * (litCount / Math.max(1, engine.lanterns.length)) + 0.35;

  // Pulse ring animation
  if (pulseAnimProgress < 1) {
    pulseAnimProgress += 0.04;
    const currentR = pulseAnimProgress * engine.tuning.pulse_radius;
    pulseRingMesh.scale.set(currentR, currentR, 1);
    pulseRingMat.opacity = Math.max(0, 1 - pulseAnimProgress);
  } else {
    pulseRingMat.opacity = 0;
  }

  updateHUD();

  renderer.render(scene, camera);
}

function updateHUD() {
  const totalSeconds = Math.max(0, Math.ceil(engine.time_left_s));
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const ss = String(totalSeconds % 60).padStart(2, '0');
  document.getElementById('hud-time').textContent = `${mm}:${ss}`;

  const timeBadge = document.getElementById('hud-time-badge');
  if (totalSeconds <= 30) timeBadge.classList.add('warning');
  else timeBadge.classList.remove('warning');

  document.getElementById('hud-score').textContent = engine.score;

  const litCount = engine.lanterns.filter((l) => l.lit).length;
  document.getElementById('hud-lanterns').textContent = `${litCount} / ${engine.lanterns.length} Đèn`;

  // Flames
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`flame-${i}`);
    if (el) {
      if (i <= engine.player.flames) el.classList.remove('lost');
      else el.classList.add('lost');
    }
  }

  // Carried Motes (Capacity grows up to 20)
  const cap = engine.player.capacity || 10;
  document.getElementById('carried-count').textContent = `${engine.player.carried}/${cap}`;
  const dotsContainer = document.getElementById('mote-dots');
  if (dotsContainer) {
    while (dotsContainer.children.length < cap) {
      const dot = document.createElement('div');
      dot.className = 'mote-dot';
      dotsContainer.appendChild(dot);
    }
    while (dotsContainer.children.length > cap) {
      dotsContainer.removeChild(dotsContainer.lastChild);
    }
    Array.from(dotsContainer.children).forEach((dot, idx) => {
      if (idx < engine.player.carried) dot.classList.add('filled');
      else dot.classList.remove('filled');
    });
  }

  // Cooldown indicators
  const dashBox = document.getElementById('cd-box-dash');
  const dashOverlay = document.getElementById('cd-overlay-dash');
  if (engine.player.dash_cd_ticks > 0) {
    dashBox.classList.remove('ready');
    dashOverlay.style.display = 'flex';
    dashOverlay.textContent = (engine.player.dash_cd_ticks / 60).toFixed(1);
  } else {
    dashBox.classList.add('ready');
    dashOverlay.style.display = 'none';
  }

  const pulseBox = document.getElementById('cd-box-pulse');
  const pulseOverlay = document.getElementById('cd-overlay-pulse');
  if (engine.player.pulse_cd_ticks > 0) {
    pulseBox.classList.remove('ready');
    pulseOverlay.style.display = 'flex';
    pulseOverlay.textContent = (engine.player.pulse_cd_ticks / 60).toFixed(1);
  } else {
    pulseBox.classList.add('ready');
    pulseOverlay.style.display = 'none';
  }

  // Interaction prompt near receptive lanterns (!lit || fuel < 100)
  const receptive = engine.lanterns.filter((l) => !l.lit || l.fuel < 100);
  let nearestLantern = null;
  let minDist = Infinity;
  for (const l of receptive) {
    const d = Math.hypot(engine.player.pos[0] - l.pos[0], engine.player.pos[2] - l.pos[2]);
    if (d <= engine.tuning.interact_radius && d < minDist) {
      minDist = d;
      nearestLantern = l;
    }
  }

  const promptEl = document.getElementById('interact-prompt');
  if (nearestLantern) {
    promptEl.style.display = 'block';
    if (!nearestLantern.lit) {
      if (nearestLantern.ever_lit) {
        promptEl.textContent = `E — Thắp lại (${nearestLantern.deposited}/5)`;
      } else {
        promptEl.textContent = `E — Thắp đèn (${nearestLantern.deposited}/10)`;
      }
    } else {
      promptEl.textContent = `E — Châm dầu (${Math.floor(nearestLantern.fuel)}/100)`;
    }
  } else {
    promptEl.style.display = 'none';
  }
}

function showGameOverModal(won, title, subtitle) {
  const modal = document.getElementById('end-modal');
  modal.style.display = 'flex';
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-title').style.color = won ? '#F2C14E' : '#FF5A5F';
  document.getElementById('modal-subtitle').textContent = subtitle;
  document.getElementById('modal-score-val').textContent = engine.score;

  const nextBtn = document.getElementById('btn-next-night');
  if (won && currentNight < 3) {
    nextBtn.style.display = 'inline-block';
    nextBtn.textContent = `Sang Đêm ${currentNight + 1}`;
  } else {
    nextBtn.style.display = 'none';
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

requestAnimationFrame(animate);
