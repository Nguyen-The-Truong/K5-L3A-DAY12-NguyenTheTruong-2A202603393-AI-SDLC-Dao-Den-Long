import { testDeterminism } from './determinism.test.js';
import { testPickup } from './scenario_pickup.test.js';
import { testLanternDepositAndWin } from './scenario_lantern.test.js';
import { testPulseStun } from './scenario_pulse.test.js';
import { testShadeHitAndLoss } from './scenario_shade.test.js';
import { testE2EHeadless } from './e2e_headless.test.js';
import { testDash } from './scenario_dash.test.js';
import { testJumpAndFall } from './scenario_jump_fall.test.js';
import { testDrifter } from './scenario_drifter.test.js';
import { testCharm } from './scenario_charm.test.js';
import { testPause } from './scenario_pause.test.js';
import { testNight2JumpPad } from './scenario_night2_jump_pad.test.js';

console.log('====================================');
console.log('  RUNNING ĐẢO ĐÈN LỒNG TEST SUITE   ');
console.log('====================================\n');

try {
  // Phase 1 regression
  testDeterminism();
  testPickup();
  testLanternDepositAndWin();
  testPulseStun();
  testShadeHitAndLoss();
  testE2EHeadless();

  // Phase 2 new features
  testDash();
  testJumpAndFall();
  testDrifter();
  testCharm();
  testPause();
  testNight2JumpPad();

  console.log('\n====================================');
  console.log('  ALL 12 TESTS PASSED SUCCESSFULLY! ');
  console.log('====================================');
  process.exit(0);
} catch (err) {
  console.error('\n❌ TEST FAILURE:', err.message);
  console.error(err.stack);
  process.exit(1);
}
