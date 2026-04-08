/**
 * Aura Live Activity Server
 * Runs locally on port 3131. Serves activity files from ./activity/ with CORS.
 * Start with: node activity-server.js
 *
 * To add cloud sync later: replace the file-based storage here with
 * a database write (Supabase, PlanetScale, etc.) — the API shape stays the same.
 */

import http from 'http';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ACTIVITY_DIR = join(__dirname, 'activity');
const PORT = 3131;

async function getAllActivity() {
  try {
    await mkdir(ACTIVITY_DIR, { recursive: true });
    const files = await readdir(ACTIVITY_DIR);
    const jsonFiles = files.filter(f => extname(f) === '.json');
    const results = await Promise.all(
      jsonFiles.map(async f => {
        try {
          const raw = await readFile(join(ACTIVITY_DIR, f), 'utf8');
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
    );
    return results.filter(Boolean);
  } catch {
    return [];
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers — allows the SvelteKit dev server to fetch from here
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /activity → return all users' activity merged into an array
  if (req.method === 'GET' && req.url === '/activity') {
    const data = await getAllActivity();
    res.writeHead(200);
    res.end(JSON.stringify(data));
    return;
  }

  // PUT /activity/:username → write/update a user's activity file
  const putMatch = req.url?.match(/^\/activity\/([a-zA-Z0-9_-]+)$/);
  if (req.method === 'PUT' && putMatch) {
    const username = putMatch[1];
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        await mkdir(ACTIVITY_DIR, { recursive: true });
        const filePath = join(ACTIVITY_DIR, `${username}.json`);
        await writeFile(filePath, JSON.stringify(data, null, 2));
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`\n✦ Aura activity server running → http://localhost:${PORT}`);
  console.log(`  Watching: ${ACTIVITY_DIR}`);
  console.log(`  Press Ctrl+C to stop\n`);
});
