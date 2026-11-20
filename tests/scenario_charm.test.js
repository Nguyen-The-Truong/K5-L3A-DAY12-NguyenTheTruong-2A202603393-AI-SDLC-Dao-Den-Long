import { GameEngine } from '../src/core/engine.js';

export function testCharm() {
  console.log('Testing Bùa Gió (Charm) mechanics...');
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    charms: [{ id: 'C1', pos: [0.5, 0, 0], available: true }]
  };

  const engine = new GameEngine({ seed: 42, night: 2, scenario });
  // Player is at 0.5m from C1 (pickup dist <= 1.0m)
  const events = engine.step({});
  const charmEv = events.find((e) => e.name === 'charm_picked');

  if (!charmEv) throw new Error('Missing charm_picked event');
  if (charmEv.data.charm_ticks !== 600) throw new Error('Expected 600 charm ticks');
  if (engine.player.charm_ticks !== 600) throw new Error('Player charm_ticks not set to 600');
  
  const c1 = engine.charms.find((c) => c.id === 'C1');
  if (c1.available) throw new Error('Charm should become unavailable after pickup');
  if (c1.respawn_ticks !== 2700) throw new Error(`Expected respawn 2700 ticks, got ${c1.respawn_ticks}`);

  console.log('✓ Charm mechanics passed: picked C1, 600 ticks buff, respawn 2700 ticks.');
}
