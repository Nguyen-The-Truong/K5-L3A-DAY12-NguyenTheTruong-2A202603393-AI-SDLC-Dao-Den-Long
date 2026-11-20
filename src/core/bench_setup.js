// Benchmark Scene Setup (Pure logic, browser and Node safe)
import { createPRNG, round3 } from './engine.js';

export function setupBenchmarkScene(engine, seed = 42) {
  engine.is_benchmark = true;
  const prng = createPRNG(seed);

  // Sinh đúng 200 Bóng Mực ở trạng thái wander rải đều trên đảo bán kính 38m
  engine.shades = [];
  for (let i = 1; i <= 200; i++) {
    const r = Math.sqrt(prng()) * 38;
    const angle = prng() * Math.PI * 2;
    const wanderAngle = prng() * Math.PI * 2;
    const wanderR = Math.sqrt(prng()) * 35;
    engine.shades.push({
      id: `S${i}`,
      pos: [round3(Math.cos(angle) * r), 0, round3(Math.sin(angle) * r)],
      state: 'wander',
      target: [round3(Math.cos(wanderAngle) * wanderR), 0, round3(Math.sin(wanderAngle) * wanderR)],
      wander_ticks: Math.floor(prng() * 120),
      state_ticks_left: 0,
      recoil_dir: [0, 0],
      push_dir: [0, 0],
      push_ticks: 0
    });
  }

  // Sinh đúng 100 đom đóm
  engine.motes = [];
  for (let i = 1; i <= 100; i++) {
    const r = Math.sqrt(prng()) * 38;
    const angle = prng() * Math.PI * 2;
    engine.motes.push({
      id: `M${i}`,
      pos: [round3(Math.cos(angle) * r), 0, round3(Math.sin(angle) * r)],
      kind: 'random',
      ttl_ticks: 0
    });
  }

  // 3 đèn L1–L3 đang sáng với fuel 100
  for (let i = 0; i < Math.min(3, engine.lanterns.length); i++) {
    engine.lanterns[i].lit = true;
    engine.lanterns[i].fuel = 100;
    engine.lanterns[i].fuel_units = 6000;
  }
}
