import { GameEngine } from '../src/core/engine.js';

export function testDash() {
  console.log('Testing dash mechanics...');
  const engine = new GameEngine({ seed: 42 });
  
  // Normal move + dash
  const events = engine.step({ move: [0, 1], cam_yaw_deg: 0, dash: true });
  const dashEv = events.find((e) => e.name === 'dash');
  if (!dashEv) throw new Error('Missing dash event');

  // During dash (speed 14 m/s for 12 ticks = 0.2s):
  // In 1 tick: delta = 14 * (1/60) = 0.2333m
  if (engine.player.pos[2] < 0.2) {
    throw new Error(`Expected player to dash in +Z, pos is ${engine.player.pos}`);
  }
  if (engine.player.dash_cd_ticks !== 90) {
    throw new Error(`Expected dash cooldown 90 ticks, got ${engine.player.dash_cd_ticks}`);
  }

  // Dash with Charm active
  engine.player.charm_ticks = 300;
  engine.player.dash_cd_ticks = 0;
  engine.player.dash_active_ticks = 0;
  const eventsCharm = engine.step({ move: [1, 0], dash: true });
  if (engine.player.dash_cd_ticks !== 0) {
    throw new Error(`Expected zero dash cooldown with charm, got ${engine.player.dash_cd_ticks}`);
  }

  console.log('✓ Dash mechanics passed: 14 m/s dash, 90 tick cooldown, 0 cooldown with charm.');
}
