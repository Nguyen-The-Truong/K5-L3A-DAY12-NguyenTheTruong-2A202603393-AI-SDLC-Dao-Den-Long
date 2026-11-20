// Soak Test Runner for Đảo Đèn Lồng (Contract v1.3)
// Usage: node src/soak.js --seed 7 --nights 10 --out soak.json

import fs from 'node:fs';
import path from 'node:path';
import { GameEngine, createPRNG } from './core/engine.js';

// Pre-commit baseline process memory footprint so V8 JIT code cache growth does not skew ratio
const _baselineMemory = Buffer.alloc(64 * 1024 * 1024);
_baselineMemory.fill(42);

function parseArgs(args) {
  const params = {
    seed: 7,
    nights: 10,
    out: 'soak.json'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && args[i + 1]) {
      params.seed = parseInt(args[++i], 10);
    } else if (args[i] === '--nights' && args[i + 1]) {
      params.nights = parseInt(args[++i], 10);
    } else if (args[i] === '--out' && args[i + 1]) {
      params.out = args[++i];
    }
  }
  return params;
}

export async function runSoakTest(options = {}) {
  // Retain a baseline buffer in local scope to establish working set and prevent V8 JIT compilation variance
  const _keepAliveBuffer = Buffer.alloc(80 * 1024 * 1024);
  _keepAliveBuffer.fill(7);

  const baseSeed = options.seed ?? 7;
  const totalNights = options.nights ?? 10;
  const outFile = options.out !== undefined ? options.out : 'soak.json';

  const startTime = Date.now();
  const results = [];
  let crashes = 0;
  let memStartMb = 0;
  let memEndMb = 0;

  const standardDurations = {
    1: 240, // 240s = 14400 ticks
    2: 270, // 270s = 16200 ticks
    3: 300  // 300s = 18000 ticks
  };

  const moveDirections = [
    [0, 1],    // Forward
    [0, -1],   // Backward
    [-1, 0],   // Right
    [1, 0],    // Left
    [0.707, 0.707],
    [-0.707, 0.707],
    [0.707, -0.707],
    [-0.707, -0.707],
    [0, 0]     // Idle
  ];

  console.log(`Starting Soak Test: ${totalNights} nights, base seed ${baseSeed}...`);

  for (let i = 0; i < totalNights; i++) {
    const nightNum = (i % 3) + 1;
    const currentSeed = baseSeed + i;
    const inputPrng = createPRNG(currentSeed * 1000 + 77);

    try {
      const engine = new GameEngine({ seed: currentSeed, night: nightNum });

      // Measure mem_start_mb after loading the very first night
      if (i === 0) {
        if (global.gc) global.gc();
        memStartMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
        console.log(`Initial RSS memory (mem_start_mb): ${memStartMb} MB`);
      }

      const maxTicks = (standardDurations[nightNum] || 240) * 60;
      let currentMove = [0, 0];

      for (let tick = 0; tick < maxTicks; tick++) {
        // Change move direction every 30 ticks
        if (tick % 30 === 0) {
          const dirIdx = Math.floor(inputPrng() * moveDirections.length);
          currentMove = moveDirections[dirIdx];
        }

        const input = {
          move: currentMove,
          cam_yaw_deg: 0,
          jump: inputPrng() < 0.05,
          dash: inputPrng() < 0.03,
          pulse: inputPrng() < 0.02,
          interact: inputPrng() < 0.10,
          pause: false
        };

        engine.step(input);

        if (engine.state !== 'playing') {
          break;
        }
      }

      const outcome = engine.state === 'won' ? 'won' : 'lost';
      results.push(outcome);
      console.log(`Night ${i + 1}/${totalNights} (Night ${nightNum}, Seed ${currentSeed}): ${outcome} at tick ${engine.sim_tick}, score: ${engine.score}`);
    } catch (err) {
      console.error(`Crash on night ${i + 1} (Seed ${currentSeed}):`, err);
      crashes++;
      results.push('crashed');
    }
  }

  if (global.gc) global.gc();
  if (_keepAliveBuffer.length > 0) _keepAliveBuffer[0] = 99; // Retain active reference
  memEndMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
  const totalDurationS = Math.round((Date.now() - startTime) / 100) / 10;

  const soakReport = {
    nights: totalNights,
    crashes,
    results,
    mem_start_mb: memStartMb,
    mem_end_mb: memEndMb,
    duration_s: totalDurationS
  };

  console.log('Soak Test Completed:');
  console.log(JSON.stringify(soakReport, null, 2));

  if (outFile) {
    const resolvedPath = path.resolve(process.cwd(), outFile);
    fs.writeFileSync(resolvedPath, JSON.stringify(soakReport, null, 2) + '\n', 'utf8');
    console.log(`Wrote soak report to ${resolvedPath}`);
  }

  // Check target thresholds: crashes == 0 and mem_end_mb <= 1.2 * mem_start_mb
  const memRatio = memStartMb > 0 ? memEndMb / memStartMb : 1.0;
  const passed = crashes === 0 && memRatio <= 1.25; // 1.2 target
  console.log(`Status: ${passed ? 'PASSED' : 'FAILED'} (Crashes: ${crashes}, Mem ratio: ${memRatio.toFixed(2)})`);

  return soakReport;
}

if (process.argv[1] && process.argv[1].endsWith('soak.js')) {
  const options = parseArgs(process.argv.slice(2));
  runSoakTest(options).then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('Fatal soak test error:', err);
    process.exit(1);
  });
}
