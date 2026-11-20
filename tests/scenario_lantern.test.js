import { GameEngine } from '../src/core/engine.js';

export function testLanternDepositAndWin() {
  console.log('Testing lantern deposit and win condition...');
  // Scenario with 1 unlit lantern and 4 already lit lanterns
  const scenario = {
    player: { pos: [0, 0, 0], carried: 3, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [
      { id: 'L1', pos: [0, 0, 1.5], deposited: 0, lit: false },
      { id: 'L2', pos: [10, 0, 10], deposited: 3, lit: true },
      { id: 'L3', pos: [-10, 0, 10], deposited: 3, lit: true },
      { id: 'L4', pos: [10, 0, -10], deposited: 3, lit: true },
      { id: 'L5', pos: [-10, 0, -10], deposited: 3, lit: true }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });
  // Player is within 1.5m of L1 (interact_radius is 2.5m)
  // Tick 1: interact = true (rising edge)
  const events1 = engine.step({ interact: true });

  const depositEv = events1.find((e) => e.name === 'deposit');
  const litEv = events1.find((e) => e.name === 'lantern_lit');
  const winEv = events1.find((e) => e.name === 'game_over' && e.data.result === 'won');

  if (!depositEv) throw new Error('Missing deposit event');
  if (!litEv) throw new Error('Missing lantern_lit event');
  if (!winEv) throw new Error('Missing game_over won event');
  if (engine.state !== 'won') throw new Error(`Expected state 'won', got '${engine.state}'`);

  console.log(`✓ Lantern deposit and win passed: deposited ${depositEv.data.amount}, all lanterns lit -> won!`);
}
