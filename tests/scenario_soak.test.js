// Test soak runner integration
import assert from 'node:assert';
import { runSoakTest } from '../src/soak.js';

export async function testSoakRunner() {
  console.log('Testing Soak test runner...');
  const report = await runSoakTest({ seed: 7, nights: 3, out: null });

  assert.strictEqual(report.crashes, 0, 'Soak test should have 0 crashes');
  assert.strictEqual(report.results.length, 3, 'Soak test should produce 3 night outcomes');
  assert.ok(report.mem_start_mb > 0, 'mem_start_mb should be > 0');
  assert.ok(report.mem_end_mb > 0, 'mem_end_mb should be > 0');
  const ratio = report.mem_end_mb / report.mem_start_mb;
  assert.ok(ratio <= 1.25, `Memory ratio ${ratio} must be <= 1.25`);

  console.log(`✓ Soak test runner passed: 3 nights, 0 crashes, mem ratio ${ratio.toFixed(2)}`);
}

if (process.argv[1] && process.argv[1].endsWith('scenario_soak.test.js')) {
  testSoakRunner().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
