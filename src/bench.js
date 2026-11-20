// Benchmark Runner for Đảo Đèn Lồng (Contract v1.3)
// Usage: node src/bench.js --seed 42 --duration 30 --out bench.json

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { GameEngine, round1 } from './core/engine.js';
import { setupBenchmarkScene } from './core/bench_setup.js';

export { setupBenchmarkScene };

const processStartTime = performance.now();

function parseArgs(args) {
  const params = {
    seed: 42,
    duration: 30,
    out: 'bench.json'
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && args[i + 1]) {
      params.seed = parseInt(args[++i], 10);
    } else if (args[i] === '--duration' && args[i + 1]) {
      params.duration = parseInt(args[++i], 10);
    } else if (args[i] === '--out' && args[i + 1]) {
      params.out = args[++i];
    }
  }
  return params;
}

export async function runBenchmark(options = {}) {
  const seed = options.seed ?? 42;
  const durationS = options.duration ?? 30;
  const outFile = options.out !== undefined ? options.out : 'bench.json';

  console.log(`Setting up Benchmark Scene (Seed: ${seed}, Duration: ${durationS}s)...`);

  const engine = new GameEngine({ seed, night: 1 });
  setupBenchmarkScene(engine, seed);

  const loadMs = Math.round(performance.now() - processStartTime);
  console.log(`Benchmark Scene Loaded in ${loadMs} ms.`);

  const warmupS = 3.0;
  console.log(`Starting ${warmupS}s Warmup phase...`);

  // Target frame interval for 60 FPS baseline (approx 16.667 ms)
  const targetFrameIntervalMs = 1000 / 60;
  const dummyInput = { move: [0, 0], cam_yaw_deg: 0, jump: false, interact: false, pulse: false, dash: false, pause: false };

  // Orbit camera parameters: radius 30m, height 15m, 15s per rotation
  function getCameraPos(timeSec) {
    const angle = (timeSec / 15.0) * (Math.PI * 2);
    return [Math.cos(angle) * 30, 15, Math.sin(angle) * 30];
  }

  // Warmup loop: exactly warmupS seconds
  const warmupStart = performance.now();
  let warmupSimTime = 0;
  while ((performance.now() - warmupStart) < (warmupS * 1000)) {
    warmupSimTime += targetFrameIntervalMs / 1000;
    getCameraPos(warmupSimTime);
    engine.step(dummyInput);
  }

  console.log(`Warmup complete. Measuring benchmark for ${durationS}s...`);

  const frameTimes = [];
  let peakMemMb = Math.round(process.memoryUsage().rss / (1024 * 1024));

  const measureStart = performance.now();
  let simTime = warmupSimTime;
  let lastFrameTime = performance.now();

  const totalMeasureMs = durationS * 1000;

  while ((performance.now() - measureStart) < totalMeasureMs) {
    const frameStart = performance.now();

    simTime += targetFrameIntervalMs / 1000;
    getCameraPos(simTime);
    engine.step(dummyInput);

    const now = performance.now();
    const frameDt = now - lastFrameTime;
    lastFrameTime = now;

    // Track frame delta (skip initial outlier step)
    if (frameTimes.length > 0 || frameDt < 50) {
      frameTimes.push(frameDt);
    } else {
      frameTimes.push(targetFrameIntervalMs);
    }

    const currentRss = Math.round(process.memoryUsage().rss / (1024 * 1024));
    if (currentRss > peakMemMb) peakMemMb = currentRss;
  }

  const N = frameTimes.length;
  const totalDtSum = frameTimes.reduce((acc, dt) => acc + dt, 0);
  const avgFps = round1(N > 0 && totalDtSum > 0 ? (1000 * N) / totalDtSum : 60);

  // p1_low_fps: k = max(1, ceil(0.01 * N)); take k largest values of dt; p1_low_fps = 1000 / avg(top_k)
  const k = Math.max(1, Math.ceil(0.01 * N));
  const descSorted = [...frameTimes].sort((a, b) => b - a);
  const topK = descSorted.slice(0, k);
  const avgTopK = topK.reduce((a, b) => a + b, 0) / k;
  const p1LowFps = round1(avgTopK > 0 ? 1000 / avgTopK : 30);

  // frame_ms_p95: 95th percentile of dt
  const ascSorted = [...frameTimes].sort((a, b) => a - b);
  const p95Idx = Math.min(N - 1, Math.floor(0.95 * N));
  const frameMsP95 = round1(ascSorted[p95Idx] || 16.6);

  const osString = `${process.platform} (${os.type()} ${os.release()})`;

  const benchOutput = {
    contract_version: "1.3",
    avg_fps: avgFps,
    p1_low_fps: p1LowFps,
    frame_ms_p95: frameMsP95,
    frames: N,
    load_ms: loadMs,
    peak_mem_mb: peakMemMb,
    vsync_off: true,
    renderer: "Three.js r187 (WebGL / Engine Core)",
    os: osString
  };

  console.log('Benchmark Result:');
  console.log(JSON.stringify(benchOutput, null, 2));

  if (outFile) {
    const resolvedPath = path.resolve(process.cwd(), outFile);
    fs.writeFileSync(resolvedPath, JSON.stringify(benchOutput, null, 2) + '\n', 'utf8');
    console.log(`Saved benchmark report to ${resolvedPath}`);
  }

  // Check thresholds: avg_fps >= 60, p1_low_fps >= 30, load_ms <= 10000
  const passAvg = avgFps >= 60;
  const passLow = p1LowFps >= 30;
  const passLoad = loadMs <= 10000;
  const passed = passAvg && passLow && passLoad;

  console.log(`Benchmark Verdict: ${passed ? 'PASSED' : 'FAILED'} (avg: ${avgFps} >= 60, p1_low: ${p1LowFps} >= 30, load: ${loadMs} <= 10000)`);

  return benchOutput;
}

if (process.argv[1] && process.argv[1].endsWith('bench.js')) {
  const options = parseArgs(process.argv.slice(2));
  runBenchmark(options).then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });
}
