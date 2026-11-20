// Local Leaderboard Manager for Đảo Đèn Lồng (Contract v1.3)
import fs from 'node:fs';
import path from 'node:path';

const LEADERBOARD_FILE = path.resolve(process.cwd(), 'leaderboard.json');

export function validatePlayerName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 12) return false;
  // Support [A-Za-z0-9_] and Vietnamese accented characters
  const nameRegex = /^[A-Za-z0-9_\u00C0-\u024F\u1EA0-\u1EF9]+$/;
  return nameRegex.test(trimmed);
}

export function getLeaderboard() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.entries)) {
        return parsed.entries;
      }
    }
  } catch (err) {
    console.error('Warning: could not read leaderboard.json:', err.message);
  }
  return [];
}

export function saveLeaderboard(entries) {
  try {
    const sorted = [...entries]
      .sort((a, b) => b.score - a.score || new Date(a.achieved_at) - new Date(b.achieved_at))
      .slice(0, 10);
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify({ entries: sorted }, null, 2) + '\n', 'utf8');
    return sorted;
  } catch (err) {
    console.error('Warning: could not save leaderboard.json:', err.message);
    return entries;
  }
}

export function addLeaderboardEntry({ name, score, nights_won = 0, seed = 42 }) {
  const validName = validatePlayerName(name) ? name.trim() : 'Player';
  const newEntry = {
    name: validName,
    score: Math.max(0, Math.floor(score || 0)),
    nights_won: Math.min(3, Math.max(0, Math.floor(nights_won || 0))),
    achieved_at: new Date().toISOString(),
    seed: seed ?? 42
  };

  const entries = getLeaderboard();
  entries.push(newEntry);
  return saveLeaderboard(entries);
}

export function exportLeaderboardToFile(targetPath) {
  const entries = getLeaderboard();
  const resolved = path.resolve(process.cwd(), targetPath);
  fs.writeFileSync(resolved, JSON.stringify({ entries }, null, 2) + '\n', 'utf8');
  console.log(`Exported ${entries.length} leaderboard entries to ${resolved}`);
  return { entries };
}
