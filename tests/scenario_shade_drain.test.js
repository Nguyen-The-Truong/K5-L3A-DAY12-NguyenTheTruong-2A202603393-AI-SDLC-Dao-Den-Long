import { GameEngine } from '../src/core/engine.js';

export function testShadeDrain() {
  console.log('Testing shade oil drain and pulse on draining shade mechanics...');

  // Setup: L1 has fuel = 20 (weak lantern < 30, lost safe zone).
  // Shade S1 placed at (0, 0, 1.8), within 2m of L1 (0, 0, 0).
  // Player placed far away at (25, 0, 0) so player is > 12m away.
  const scenario = {
    player: { pos: [25, 0, 0], carried: 3, flames: 3 },
    random_motes: false,
    random_shades: false,
    lanterns: [
      { id: 'L1', pos: [0, 0, 0], lit: true, fuel: 20.0, ever_lit: true }
    ],
    shades: [
      { id: 'S1', pos: [0, 0, 1.8], state: 'wander', target_lantern_id: 'L1' }
    ]
  };

  const engine = new GameEngine({ seed: 42, scenario });

  // 1. In tick 1: S1 is within 2m of weak lantern L1 -> transitions to 'drain'
  engine.step({});
  const s1 = engine.shades.find((s) => s.id === 'S1');
  if (s1.state !== 'drain') {
    throw new Error(`Expected S1 state to be 'drain', got '${s1.state}'`);
  }

  // 2. Continuous drain: 5 fuel/s (5 units/tick) + natural decay (1 unit/tick) = 6 units/tick.
  // Over 60 ticks (1s): total fuel lost = 360 units = 6.0 fuel.
  // At tick 60, should emit 'fuel_drain' event!
  let drainEvent = null;
  for (let i = 0; i < 60; i++) {
    const evs = engine.step({});
    const found = evs.find((e) => e.name === 'fuel_drain');
    if (found) drainEvent = found;
  }

  if (!drainEvent) throw new Error('Missing fuel_drain event after 60 ticks of continuous draining');
  if (drainEvent.data.lantern_id !== 'L1' || drainEvent.data.shade_id !== 'S1') {
    throw new Error(`Invalid fuel_drain event data: ${JSON.stringify(drainEvent.data)}`);
  }

  const l1 = engine.lanterns.find((l) => l.id === 'L1');
  // Initial fuel was 20.0 = 1200 units. After 60 ticks: 1200 - 360 = 840 units = 14.0 fuel
  const currentFuel = l1.fuel_units / 60;
  if (Math.abs(currentFuel - 14.0) > 0.5) {
    throw new Error(`Expected lantern fuel around 14.0 after 60 ticks of drain, got ${currentFuel}`);
  }

  // 3. Pulse on draining shade gives +15 points (per_stun_drain)
  // Move player within pulse radius of S1
  engine.player.pos = [0, 0, 3.5]; // 1.7m from S1, within 5.0m pulse radius
  engine.player.pulse_cd_ticks = 0;
  const scoreBefore = engine.score;
  const pulseEvents = engine.step({ pulse: true });
  const pulseEv = pulseEvents.find((e) => e.name === 'pulse');

  if (!pulseEv) throw new Error('Missing pulse event');
  if (s1.state !== 'stunned') throw new Error(`Expected S1 state to be 'stunned', got '${s1.state}'`);
  const scoreGained = engine.score - scoreBefore;
  if (scoreGained !== 15) {
    throw new Error(`Expected +15 points for stunning a draining shade, got +${scoreGained}`);
  }

  // 4. Wakeup to chase when Mây comes within 6m
  // Reset S1 to drain with player at 10m, then move player to 5m
  engine.player.pos = [10, 0, 0];
  s1.state = 'drain';
  s1.drain_target_id = 'L1';
  engine.step({});
  if (s1.state !== 'drain') throw new Error('Expected S1 to stay in drain when player is 10m away');

  engine.player.pos = [5, 0, 0]; // Within 6m
  engine.step({});
  if (s1.state !== 'chase') {
    throw new Error(`Expected S1 to transition from 'drain' to 'chase' when player is within 6m, got '${s1.state}'`);
  }

  console.log('✓ Shade drain passed: entered drain, drained 6 units/tick, emitted fuel_drain, +15 on pulse, woke to chase within 6m!');
}