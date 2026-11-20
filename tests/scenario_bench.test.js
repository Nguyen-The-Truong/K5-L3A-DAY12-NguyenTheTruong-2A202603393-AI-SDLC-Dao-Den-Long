// Test benchmark scene and metrics
import assert from 'node:assert';
import { runBenchmark } from '../src/bench.js';
import { GameEngine } from '../src/core/engine.js';
import { setupBenchmarkScene } from '../src/core/bench_setup.js';

export async function testBenchmark() {
  console.log('Testing Benchmark scene setup and metrics...');

  // Test setup
  const engine = new GameEngine({ seed: 42, night: 1 });
  setupBenchmarkScene(engine, 42);

  assert.strictEqual(engine.shades.length, 200, 'Must have exactly 200 shades');
  assert.strictEqual(engine.motes.length, 100, 'Must have exactly 100 motes');
  const litCount = engine.lanterns.filter((l) => l.lit && l.fuel === 100).length;
  assert.strictEqual(litCount, 3, 'Must have exactly 3 lanterns lit with fuel 100');

  // Test execution
  const res = await runBenchmark({ seed: 42, duration: 1, out: null });
  assert.strictEqual(res.contract_version, '1.3', 'Contract version must be 1.3');
  assert.ok(res.avg_fps >= 60, `avg_fps ${res.avg_fps} must be >= 60`);
  assert.ok(res.p1_low_fps >= 30, `p1_low_fps ${res.p1_low_fps} must be >= 30`);
  assert.ok(res.load_ms <= 10000, `load_ms ${res.load_ms} must be <= 10000`);

  console.log(`✓ Benchmark test passed: avg_fps ${res.avg_fps}, p1_low ${res.p1_low_fps}, load ${res.load_ms}ms`);
}

if (process.argv[1] && process.argv[1].endsWith('scenario_bench.test.js')) {
  testBenchmark().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
