import fs from 'node:fs';
import { execSync } from 'node:child_process';

export function testE2EHeadless() {
  console.log('Testing E2E headless CLI execution with scenario and inputs...');
  const scenario = {
    player: { pos: [0, 0, 0], carried: 0, flames: 3 },
    random_motes: false,
    random_shades: false,
    motes: [[0, 0, 3]],
    shades: [{ id: 'S1', pos: [15, 0, 0] }],
    lanterns: [{ id: 'L1', pos: [0, 0, 3], deposited: 0, lit: false }],
    time_left_s: 180
  };

  const inputs = {
    frames: [
      { tick: 0, move: [0, 1], cam_yaw_deg: 0 },
      { tick: 40, move: [0, 0], interact: true },
      { tick: 41, interact: false }
    ]
  };

  fs.writeFileSync('temp_scenario.json', JSON.stringify(scenario));
  fs.writeFileSync('temp_inputs.json', JSON.stringify(inputs));

  try {
    execSync('node src/headless.js --seed 42 --night 1 --scenario temp_scenario.json --inputs temp_inputs.json --ticks 60 --out temp_out.jsonl');
    const content = fs.readFileSync('temp_out.jsonl', 'utf8').trim().split('\n');
    
    // Check lines
    if (content.length < 3) throw new Error('Expected at least 3 lines in JSONL output');
    const firstLine = JSON.parse(content[0]);
    const lastLine = JSON.parse(content[content.length - 1]);

    if (firstLine.type !== 'snapshot' || firstLine.tick !== 0) {
      throw new Error('First line must be snapshot at tick 0');
    }
    if (lastLine.type !== 'end' || typeof lastLine.score !== 'number') {
      throw new Error('Last line must be end record');
    }

    // Check event mote_picked and deposit
    const events = content.map((l) => JSON.parse(l)).filter((o) => o.type === 'event');
    const picked = events.find((e) => e.name === 'mote_picked');
    const deposit = events.find((e) => e.name === 'deposit');

    if (!picked) throw new Error('E2E failed: missing mote_picked event in output');
    if (!deposit) throw new Error('E2E failed: missing deposit event in output');

    console.log('✓ E2E Headless CLI test passed: valid scenario + inputs produced correct events and end record.');
  } finally {
    if (fs.existsSync('temp_scenario.json')) fs.unlinkSync('temp_scenario.json');
    if (fs.existsSync('temp_inputs.json')) fs.unlinkSync('temp_inputs.json');
    if (fs.existsSync('temp_out.jsonl')) fs.unlinkSync('temp_out.jsonl');
  }
}
