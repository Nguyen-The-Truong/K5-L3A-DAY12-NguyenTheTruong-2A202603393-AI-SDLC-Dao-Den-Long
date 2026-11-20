import { GameEngine } from '../src/core/engine.js';

export function testDrifter() {
  console.log('Testing Gió Lạc (Drifter) stealing and pulse drop...');
  const scenario = {
    player: { pos: [0, 0, 0], carried: 6, flames: 3 },
    random_drifters: false,
    drifters: [{ id: 'D1', pos: [1.0, 0, 0], state: 'chase', stolen: 0 }]
  };

  const engine = new GameEngine({ seed: 42, night: 2, scenario });
  // Drifter is at 1.0m (XZ <= 1.2m), should steal min(3, 6) = 3 motes
  const events = engine.step({});
  const stealEv = events.find((e) => e.name === 'drifter_steal');

  if (!stealEv) throw new Error('Missing drifter_steal event');
  if (stealEv.data.amount !== 3) throw new Error(`Expected stolen amount 3, got ${stealEv.data.amount}`);
  if (engine.player.carried !== 3) throw new Error(`Expected player carried 3, got ${engine.player.carried}`);

  // Now trigger pulse on fleeing drifter with stolen motes
  // Give player 3 motes for pulse cost
  engine.player.carried = 3;
  const pulseEvents = engine.step({ pulse: true });
  const dropEv = pulseEvents.find((e) => e.name === 'drifter_drop');

  if (!dropEv) throw new Error('Missing drifter_drop event');
  if (dropEv.data.amount !== 3) throw new Error(`Expected drop amount 3, got ${dropEv.data.amount}`);

  console.log('✓ Drifter test passed: stole 3 motes, entered flee, dropped motes upon pulse.');
}
