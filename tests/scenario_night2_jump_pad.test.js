import { GameEngine } from '../src/core/engine.js';

export function testNight2JumpPad() {
  console.log('Testing Night 2 jump pad launching...');
  // Place player right at Jump Pad 1: (20, 0, 18)
  const scenario = {
    player: { pos: [20, 0, 18], grounded: true }
  };

  const engine = new GameEngine({ seed: 42, night: 2, scenario });
  engine.step({});

  if (!engine.player.launch_active) throw new Error('Expected launch_active to be true');
  if (engine.player.vel[1] < 13.0 || engine.player.grounded) {
    throw new Error(`Expected airborne launch Y velocity, got ${engine.player.vel[1]}`);
  }
  
  // Horizontal speed should be 24.0 m/s
  const hSpeed = Math.hypot(engine.player.launch_vel[0], engine.player.launch_vel[2]);
  if (Math.abs(hSpeed - 24.0) > 0.01) {
    throw new Error(`Expected horizontal launch speed 24.0 m/s, got ${hSpeed}`);
  }

  console.log('✓ Jump pad test passed: launched with Y vel 14.0 m/s, horizontal vel 24.0 m/s.');
}
