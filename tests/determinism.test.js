import fs from 'node:fs';
import { GameEngine } from '../src/core/engine.js';

export function testDeterminism() {
  console.log('Testing determinism...');
  const seed = 999;
  const engine1 = new GameEngine({ seed });
  const engine2 = new GameEngine({ seed });

  const input = { move: [0.5, 0.5], cam_yaw_deg: 45, interact: false, pulse: false };

  for (let i = 0; i < 300; i++) {
    engine1.step(input);
    engine2.step(input);
  }

  const snap1 = JSON.stringify(engine1.getSnapshot());
  const snap2 = JSON.stringify(engine2.getSnapshot());

  if (snap1 !== snap2) {
    throw new Error('Determinism failed: state snapshots differ for same seed and input!');
  }
  console.log('✓ Determinism test passed: 300 ticks produced 100% identical states.');
}
