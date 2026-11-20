import { GameEngine } from '../src/core/engine.js';

export function testFuelDecayAndRelight() {
  console.log('Testing fuel decay, refuel, lantern_out, and relight mechanics...');

  // Setup: L1 is lit with fuel = 1.0 (60 units = 60 ticks remaining)
  const scenario = {
    player: { pos: [0, 0, 0], carried: 8, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [
      { id: 'L1', pos: [0, 0, 1.5], lit: true, fuel: 1.0, ever_lit: true }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });

  // 1. Natural decay over 30 ticks: fuel drops from 1.0 to 0.5 (30 units lost)
  for (let i = 0; i < 30; i++) {
    engine.step({});
  }
  const snap30 = engine.getSnapshot();
  const l1Snap = snap30.lanterns.find((l) => l.id === 'L1');
  if (Math.abs(l1Snap.fuel - 0.5) > 0.1) {
    throw new Error(`Expected L1 fuel around 0.5 after 30 ticks, got ${l1Snap.fuel}`);
  }

  // 2. Refuel test:
  // L1 is within 1.5m, Mây has 8 motes.
  // ceil((100 - 0.5) / 10) = 10, min(8, 10) = 8 motes used.
  // fuel becomes min(100, 0.5 + 8 * 10) = 80.5
  const refuelEvents = engine.step({ interact: true });
  const refuelEv = refuelEvents.find((e) => e.name === 'refuel');
  if (!refuelEv) throw new Error('Missing refuel event');
  if (refuelEv.data.amount !== 8) throw new Error(`Expected 8 motes used for refuel, got ${refuelEv.data.amount}`);
  if (engine.player.carried !== 0) throw new Error(`Expected 0 motes carried, got ${engine.player.carried}`);

  // 3. Lantern out test:
  // Drain remaining fuel to 0
  const l1 = engine.lanterns.find((l) => l.id === 'L1');
  l1.fuel_units = 2; // Will extinguish in 2 ticks

  let outEvent = null;
  for (let i = 0; i < 5; i++) {
    const evs = engine.step({ interact: false });
    const found = evs.find((e) => e.name === 'lantern_out');
    if (found) outEvent = found;
  }

  if (!outEvent) throw new Error('Missing lantern_out event when fuel reached 0');
  if (l1.lit !== false) throw new Error('Expected lantern to be unlit after running out of oil');
  if (l1.ever_lit !== true) throw new Error('Expected lantern to remember ever_lit = true');

  // 4. Relight test:
  // Đèn đã từng sáng (ever_lit = true) chỉ cần 5 đom đóm (thay vì 10)
  engine.player.carried = 5;
  const relightEvents = engine.step({ interact: true });
  const litEv = relightEvents.find((e) => e.name === 'lantern_lit');

  if (!litEv) throw new Error('Missing lantern_lit event upon relighting with 5 motes');
  if (litEv.data.relight !== true) throw new Error(`Expected relight: true, got ${litEv.data.relight}`);
  if (l1.lit !== true) throw new Error('Expected lantern to be lit after relighting');
  if (l1.fuel_units !== 6000) throw new Error(`Expected fuel to be reset to 100 (6000 units), got ${l1.fuel_units}`);
  if (l1.relit_count !== 1) throw new Error(`Expected relit_count to be 1, got ${l1.relit_count}`);

  console.log('✓ Fuel decay, refuel, lantern_out, and relight passed: fuel decayed, refueled, extinguished at 0, relit with 5 motes!');
}