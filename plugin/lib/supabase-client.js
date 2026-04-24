'use strict';

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Parse plugin/.env manually — no dotenv dependency needed
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
}

try {
  loadEnv();
} catch {
  // .env not found — credentials must come from environment
}

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[symphony-plugin] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Create plugin/.env.');
  process.exit(0); // exit 0 so Claude Code session is not interrupted
}

module.exports = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
