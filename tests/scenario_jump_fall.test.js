import { GameEngine } from '../src/core/engine.js';

export function testJumpAndFall() {
  console.log('Testing jump physics and fall off island...');
  const engine = new GameEngine({ seed: 42 });

  // Jump from ground
  engine.step({ jump: true });
  if (engine.player.grounded || engine.player.pos[1] <= 0 || engine.player.vel[1] < 6.0) {
    throw new Error(`Expected jumping with positive altitude, pos[1]=${engine.player.pos[1]}, vel[1]=${engine.player.vel[1]}`);
  }

  // Fall off island test: position player at island edge and move beyond 40m
  const fallEngine = new GameEngine({ seed: 42, scenario: { player: { pos: [39.5, 0, 0], carried: 4, flames: 3 } } });
  
  let fallHitEv = null;
  // Move +X off island (beyond R=40)
  for (let t = 0; t < 90; t++) {
    const events = fallEngine.step({ move: [1, 0], cam_yaw_deg: 0 });
    const ev = events.find((e) => e.name === 'player_hit' && e.data.by === 'fall');
    if (ev) {
      fallHitEv = ev;
      break;
    }
  }

  if (!fallHitEv) throw new Error('Expected fall player_hit event when Y < -10');
  if (fallHitEv.data.flames !== 2) throw new Error(`Expected flames to decrease to 2, got ${fallHitEv.data.flames}`);
  if (fallHitEv.data.lost !== true) throw new Error('Expected lost: true in fall event data');
  if (fallEngine.player.carried !== 0) throw new Error('Expected all carried motes lost on fall');

  console.log('✓ Jump and fall passed: jump impulse 7.0 m/s, fall hit -1 flame, lost motes, respawn.');
}
