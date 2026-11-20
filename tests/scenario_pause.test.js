import { GameEngine } from '../src/core/engine.js';

export function testPause() {
  console.log('Testing pause mechanics...');
  const engine = new GameEngine({ seed: 42 });

  // Trigger pause
  const events1 = engine.step({ pause: true });
  const pausedEv = events1.find((e) => e.name === 'paused');
  if (!pausedEv) throw new Error('Missing paused event');
  if (engine.state !== 'paused') throw new Error(`Expected state 'paused', got ${engine.state}`);

  const simTickBefore = engine.sim_tick;
  const timeLeftBefore = engine.time_left_s;

  // Step while paused, release pause button (pause: false)
  engine.step({ pause: false });
  if (engine.sim_tick !== simTickBefore) throw new Error('sim_tick should not advance while paused');
  if (engine.time_left_s !== timeLeftBefore) throw new Error('time_left_s should not decrease while paused');

  // Resume (rising edge of pause: true)
  const events3 = engine.step({ pause: true });
  const resumedEv = events3.find((e) => e.name === 'resumed');
  if (!resumedEv) throw new Error('Missing resumed event');
  if (engine.state !== 'playing') throw new Error(`Expected state 'playing', got ${engine.state}`);

  console.log('✓ Pause mechanics passed: toggles pause/resume, freezes sim_tick and timers.');
}
