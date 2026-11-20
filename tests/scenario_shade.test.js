import { GameEngine } from '../src/core/engine.js';

export function testShadeHitAndLoss() {
  console.log('Testing shade hit and loss condition...');
  const scenario = {
    player: { pos: [0, 0, 0], carried: 2, flames: 1 },
    random_motes: false,
    random_shades: false,
    shades: [{ id: 'S1', pos: [0.5, 0, 0] }] // Within shade_hit_radius 1.2m
  };

  const engine = new GameEngine({ seed: 42, scenario });
  const events = engine.step({});

  const hitEv = events.find((e) => e.name === 'player_hit');
  const lossEv = events.find((e) => e.name === 'game_over' && e.data.result === 'lost');

  if (!hitEv) throw new Error('Missing player_hit event');
  if (!lossEv) throw new Error('Missing game_over lost event');
  if (engine.state !== 'lost') throw new Error(`Expected state 'lost', got '${engine.state}'`);
  if (lossEv.data.reason !== 'no_flames') throw new Error(`Expected reason 'no_flames', got '${lossEv.data.reason}'`);

  console.log(`✓ Shade hit and loss passed: hit by shade, flames reduced to 0 -> lost (no_flames)`);
}
