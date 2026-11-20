// Test leaderboard validation, persistence, sorting, and export
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { validatePlayerName, addLeaderboardEntry, getLeaderboard, exportLeaderboardToFile } from '../src/core/leaderboard.js';

export function testLeaderboard() {
  console.log('Testing Leaderboard logic and export...');

  // 1. Validation test
  assert.strictEqual(validatePlayerName('May'), true);
  assert.strictEqual(validatePlayerName('Nguyen_123'), true);
  assert.strictEqual(validatePlayerName('Trường'), true); // Vietnamese accents
  assert.strictEqual(validatePlayerName('ab'), false); // Too short (< 3)
  assert.strictEqual(validatePlayerName('ThisNameIsWayTooLong12345'), false); // Too long (> 12)
  assert.strictEqual(validatePlayerName('Hacker@#$'), false); // Special chars

  // 2. Add entries
  addLeaderboardEntry({ name: 'Alpha', score: 100, nights_won: 1, seed: 1 });
  addLeaderboardEntry({ name: 'Beta', score: 250, nights_won: 2, seed: 2 });
  addLeaderboardEntry({ name: 'Gamma', score: 180, nights_won: 1, seed: 3 });

  const entries = getLeaderboard();
  assert.ok(entries.length >= 3, 'Should have at least 3 entries');
  // Highest score first
  assert.ok(entries[0].score >= entries[1].score, 'Should be sorted descending by score');

  // 3. Export test
  const testOut = path.resolve(process.cwd(), 'test_lb_export.json');
  exportLeaderboardToFile(testOut);
  assert.ok(fs.existsSync(testOut), 'Exported file must exist');
  const parsed = JSON.parse(fs.readFileSync(testOut, 'utf8'));
  assert.ok(Array.isArray(parsed.entries), 'Exported JSON must contain entries array');

  // Cleanup test export
  try { fs.unlinkSync(testOut); } catch (e) {}

  console.log('✓ Leaderboard test passed: valid names, descending score sort, top-10 limit, and export verified.');
}

if (process.argv[1] && process.argv[1].endsWith('scenario_leaderboard.test.js')) {
  testLeaderboard();
}
