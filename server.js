// Simple local static web server for Đảo Đèn Lồng (Contract v1.3)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLeaderboard, addLeaderboardEntry, exportLeaderboardToFile } from './src/core/leaderboard.js';

// CLI export leaderboard flag support: npm start -- --export-leaderboard out.json
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--export-leaderboard') {
    const targetFile = args[i + 1] || 'leaderboard.json';
    exportLeaderboardToFile(targetFile);
    process.exit(0);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // API endpoints for leaderboard
  if (reqPath === '/api/leaderboard') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
      res.end(JSON.stringify({ entries: getLeaderboard() }));
      return;
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const updated = addLeaderboardEntry(data);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ success: true, entries: updated }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=UTF-8' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }
  }

  if (reqPath === '/' || reqPath === '') {
    reqPath = '/src/ui/index.html';
  }

  // Route alias for Three.js module
  let filePath = '';
  if (reqPath === '/three.module.js' || reqPath === '/lib/three.module.js') {
    filePath = path.join(__dirname, 'node_modules', 'three', 'build', 'three.module.js');
  } else if (reqPath.startsWith('/src/')) {
    filePath = path.join(__dirname, reqPath);
  } else if (reqPath.startsWith('/core/')) {
    filePath = path.join(__dirname, 'src', reqPath);
  } else {
    filePath = path.join(__dirname, 'src', 'ui', reqPath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, reqPath);
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end(`404 Not Found: ${reqPath}`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end(`500 Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Đảo Đèn Lồng 3D Game Server running at: http://localhost:${PORT}`);
});
