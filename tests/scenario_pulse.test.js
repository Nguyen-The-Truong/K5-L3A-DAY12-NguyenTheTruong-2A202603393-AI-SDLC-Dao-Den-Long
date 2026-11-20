import { GameEngine } from '../src/core/engine.js';

export function testPulseStun() {
  console.log('Testing pulse stun and pushback...');
  const scenario = {
    player: { pos: [0, 0, 0], carried: 3, flames: 3 },
    random_motes: false,
    random_shades: false,
    shades: [{ id: 'S1', pos: [3.0, 0, 0] }] // 3m away, within pulse_radius 5.0m
  };

  const engine = new GameEngine({ seed: 42, scenario });
  // Trigger pulse
  const events = engine.step({ pulse: true });
  const pulseEv = events.find((e) => e.name === 'pulse');

  if (!pulseEv) throw new Error('Missing pulse event');
  if (!pulseEv.data.stunned_ids.includes('S1')) {
    throw new Error('S1 was not stunned by pulse');
  }

  const s1 = engine.shades.find((s) => s.id === 'S1');
  if (s1.state !== 'stunned') throw new Error(`Expected shade state 'stunned', got '${s1.state}'`);
  if (s1.pos[0] <= 3.0) throw new Error(`Expected shade to be pushed further than 3.0m, got ${s1.pos[0]}`);
  if (engine.player.carried !== 0) throw new Error(`Expected player carried to be 0 after pulse cost 3, got ${engine.player.carried}`);

  console.log(`✓ Pulse stun passed: stunned S1, pushed to pos: [${s1.pos}], carried left: ${engine.player.carried}`);
}
