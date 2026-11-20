import { GameEngine } from '../src/core/engine.js';

/**
 * Test kịch bản nạp đom đóm, thắp đèn, tăng sức chứa và luật thắng bình minh (Phase 3).
 * 
 * LƯU Ý THAY ĐỔI (PHASE 3 CHANGE REQUEST - TICKET-03):
 * - [THAY THẾ] "Thắng ngay khi tất cả đèn sáng": Thắp đủ 5 đèn KHÔNG CÒN kết thúc Đêm sớm.
 *   Game tiếp tục chạy ở trạng thái 'playing' để người chơi bảo vệ và châm dầu cho đèn.
 * - Sức chứa của Mây tăng: capacity = 10 + 2 * successful_lights (từ 10 lên 12).
 * - Khi thời gian về 0 (bình minh) với số đèn sáng >= ceil(0.6 * 5) = 3: Game thắng với lý do 'dawn_survived'.
 */
export function testLanternDepositAndWin() {
  console.log('Testing lantern deposit, lighting, and Phase 3 dawn_survived win condition...');
  // Scenario with 1 unlit lantern and 4 already lit lanterns
  const scenario = {
    player: { pos: [0, 0, 0], carried: 3, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [
      { id: 'L1', pos: [0, 0, 1.5], deposited: 7, lit: false, ever_lit: false },
      { id: 'L2', pos: [10, 0, 10], deposited: 10, lit: true, fuel: 90 },
      { id: 'L3', pos: [-10, 0, 10], deposited: 10, lit: true, fuel: 80 },
      { id: 'L4', pos: [10, 0, -10], deposited: 10, lit: true, fuel: 70 },
      { id: 'L5', pos: [-10, 0, -10], deposited: 10, lit: true, fuel: 60 }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  // Player is within 1.5m of L1 (interact_radius is 2.0m)
  // Tick 1: interact = true (rising edge)
  const events1 = engine.step({ interact: true });

  const depositEv = events1.find((e) => e.name === 'deposit');
  const litEv = events1.find((e) => e.name === 'lantern_lit');

  if (!depositEv) throw new Error('Missing deposit event');
  if (depositEv.data.amount !== 3) throw new Error(`Expected deposit amount 3, got ${depositEv.data.amount}`);
  if (!litEv) throw new Error('Missing lantern_lit event');
  if (litEv.data.relight !== false) throw new Error(`Expected relight: false on first light, got ${litEv.data.relight}`);

  // Phase 3 Rule: Lighting all lanterns does NOT immediately end the night!
  if (engine.state !== 'playing') {
    throw new Error(`Expected game to remain in 'playing' state after lighting all lanterns (Phase 3), got '${engine.state}'`);
  }

  // Phase 3 Rule: Capacity increases by +2 per successful light (10 -> 12)
  if (engine.player.capacity !== 12) {
    throw new Error(`Expected player capacity to be 12 after lighting L1, got ${engine.player.capacity}`);
  }

  // Fast forward simulation to dawn (sim_tick reached night duration)
  engine.sim_tick = Math.round(engine.initial_time_left_s * 60);
  const eventsDawn = engine.step({});
  const winEv = eventsDawn.find((e) => e.name === 'game_over' && e.data.result === 'won');

  if (!winEv) throw new Error('Missing game_over won event at dawn');
  if (winEv.data.reason !== 'dawn_survived') {
    throw new Error(`Expected win reason 'dawn_survived', got '${winEv.data.reason}'`);
  }
  if (engine.state !== 'won') throw new Error(`Expected state 'won', got '${engine.state}'`);

  console.log(`✓ Lantern deposit, capacity growth, and dawn_survived passed: deposited ${depositEv.data.amount}, all lanterns lit, survived to dawn!`);
}