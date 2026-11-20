import { GameEngine } from '../src/core/engine.js';

export function testPickup() {
  console.log('Testing mote pickup...');
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [[0, 0, 2]] // 2m ahead in +Z
  };

  const engine = new GameEngine({ seed: 42, scenario });
  // Move toward +Z: move: [0, 1] with cam_yaw_deg: 0 moves toward +Z
  // Speed 6.0 m/s -> in 20 ticks (1/3 s) moves 2.0m, entering pickup radius (2.0m)
  let pickedEvent = null;
  for (let tick = 0; tick < 30; tick++) {
    const events = engine.step({ move: [0, 1], cam_yaw_deg: 0 });
    const ev = events.find((e) => e.name === 'mote_picked');
    if (ev) pickedEvent = ev;
  }

  if (!pickedEvent) {
    throw new Error('Mote pickup failed: no mote_picked event emitted');
  }
  if (engine.player.carried !== 1) {
    throw new Error(`Expected player.carried to be 1, got ${engine.player.carried}`);
  }
  console.log(`✓ Mote pickup passed: picked at tick ${pickedEvent.tick}, carried: ${pickedEvent.data.carried}`);
}
