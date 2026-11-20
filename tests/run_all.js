import { testDeterminism } from './determinism.test.js';
import { testPickup } from './scenario_pickup.test.js';
import { testLanternDepositAndWin } from './scenario_lantern.test.js';
import { testPulseStun } from './scenario_pulse.test.js';
import { testShadeHitAndLoss } from './scenario_shade.test.js';
import { testE2EHeadless } from './e2e_headless.test.js';

console.log('====================================');
console.log('  RUNNING ĐẢO ĐÈN LỒNG TEST SUITE   ');
console.log('====================================\n');

try {
  testDeterminism();
  testPickup();
  testLanternDepositAndWin();
  testPulseStun();
  testShadeHitAndLoss();
  testE2EHeadless();
  console.log('\n====================================');
  console.log('  ALL 6 TESTS PASSED SUCCESSFULLY!  ');
  console.log('====================================');
  process.exit(0);
} catch (err) {
  console.error('\n❌ TEST FAILURE:', err.message);
  console.error(err.stack);
  process.exit(1);
}
