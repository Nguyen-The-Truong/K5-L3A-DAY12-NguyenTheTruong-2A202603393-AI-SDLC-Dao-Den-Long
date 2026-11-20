#!/usr/bin/env node
// Headless runner for Test Contract v1.0
import fs from 'node:fs';
import path from 'node:path';
import { GameEngine, DEFAULT_TUNING } from './core/engine.js';

function printUsageAndExit(code = 1, msg = '') {
  if (msg) console.error(msg);
  console.error('Usage: node src/headless.js --seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]');
  process.exit(code);
}

// Parse command line arguments
const args = process.argv.slice(2);
let seed = 42;
let night = 1;
let scenarioPath = null;
let inputsPath = null;
let ticks = null;
let outPath = null;
let snapshotEvery = 10;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--seed') {
    seed = parseInt(args[++i], 10);
    if (Number.isNaN(seed)) printUsageAndExit(1, 'Invalid --seed');
  } else if (arg === '--night') {
    night = parseInt(args[++i], 10);
  } else if (arg === '--scenario') {
    scenarioPath = args[++i];
  } else if (arg === '--inputs') {
    inputsPath = args[++i];
  } else if (arg === '--ticks') {
    ticks = parseInt(args[++i], 10);
    if (Number.isNaN(ticks) || ticks < 0) printUsageAndExit(1, 'Invalid --ticks');
  } else if (arg === '--out') {
    outPath = args[++i];
  } else if (arg === '--snapshot-every') {
    snapshotEvery = parseInt(args[++i], 10);
    if (Number.isNaN(snapshotEvery) || snapshotEvery <= 0) snapshotEvery = 10;
  } else {
    printUsageAndExit(1, `Unknown argument: ${arg}`);
  }
}

if (ticks === null || !outPath) {
  printUsageAndExit(1, 'Missing required argument --ticks or --out');
}

// Load tuning from game.contract.json if present
let tuning = { ...DEFAULT_TUNING };
try {
  const contractPath = path.resolve('game.contract.json');
  if (fs.existsSync(contractPath)) {
    const rawContract = fs.readFileSync(contractPath, 'utf8');
    const contract = JSON.parse(rawContract);
    if (contract.tuning) {
      tuning = { ...DEFAULT_TUNING, ...contract.tuning };
    }
  }
} catch (e) {
  console.error('Warning: could not parse game.contract.json, using defaults');
}

// Load scenario file if specified
let scenario = null;
if (scenarioPath) {
  try {
    const content = fs.readFileSync(scenarioPath, 'utf8');
    scenario = JSON.parse(content);
  } catch (err) {
    console.error(`Error reading scenario file ${scenarioPath}: ${err.message}`);
    process.exit(2);
  }
}

// Load inputs file if specified
let inputFramesMap = new Map();
if (inputsPath) {
  try {
    const content = fs.readFileSync(inputsPath, 'utf8');
    const inputData = JSON.parse(content);
    if (!inputData || !Array.isArray(inputData.frames)) {
      console.error('Invalid inputs file: frames must be an array');
      process.exit(2);
    }
    let prevTick = -1;
    for (const frame of inputData.frames) {
      if (typeof frame.tick !== 'number' || frame.tick <= prevTick) {
        console.error('Invalid inputs file: frame ticks must be strictly increasing');
        process.exit(2);
      }
      prevTick = frame.tick;
      inputFramesMap.set(frame.tick, frame);
    }
  } catch (err) {
    console.error(`Error reading inputs file ${inputsPath}: ${err.message}`);
    process.exit(2);
  }
}

// Initialize engine
const engine = new GameEngine({
  seed,
  tuning,
  scenario
});

// Ensure output directory exists
const outDir = path.dirname(path.resolve(outPath));
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outStream = fs.createWriteStream(outPath, { encoding: 'utf8' });

function writeLine(obj) {
  outStream.write(JSON.stringify(obj) + '\n');
}

// Snapshot at tick 0 (initial state after scenario setup, before applying input)
writeLine(engine.getSnapshot());

// Default active input
let activeInput = {
  move: [0, 0],
  cam_yaw_deg: 0,
  jump: false,
  interact: false,
  pulse: false
};

// Simulation loop
for (let step = 0; step < ticks; step++) {
  // If game has already won or lost, stop
  if (engine.state !== 'playing') {
    break;
  }

  // Check if there is an input frame for this tick
  if (inputFramesMap.has(step)) {
    const frame = inputFramesMap.get(step);
    activeInput = {
      move: frame.move !== undefined ? frame.move : activeInput.move,
      cam_yaw_deg: frame.cam_yaw_deg !== undefined ? frame.cam_yaw_deg : activeInput.cam_yaw_deg,
      jump: frame.jump !== undefined ? frame.jump : activeInput.jump,
      interact: frame.interact !== undefined ? frame.interact : activeInput.interact,
      pulse: frame.pulse !== undefined ? frame.pulse : activeInput.pulse
    };
  }

  // Execute tick
  const events = engine.step(activeInput);

  // Emit events immediately
  for (const ev of events) {
    writeLine(ev);
  }

  // Emit snapshot if matches interval
  if (engine.sim_tick % snapshotEvery === 0) {
    writeLine(engine.getSnapshot());
  }

  if (engine.state !== 'playing') {
    break;
  }
}

// Final end record
writeLine(engine.getEndRecord());

outStream.end(() => {
  process.exit(0);
});
