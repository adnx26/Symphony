'use strict';

const fs = require('fs');
const path = require('path');

const pluginDir = path.resolve(__dirname);
const settingsPath = path.resolve(__dirname, '../.claude/settings.json');

// Read existing settings or start fresh
let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
} catch (err) {
  if (err.code !== 'ENOENT') {
    console.error('[symphony-plugin] Error reading settings.json:', err.message);
    process.exit(1);
  }
  // file doesn't exist yet — will be created
}

settings.hooks = settings.hooks || {};

function hookEntry(scriptName) {
  return {
    matcher: '',
    hooks: [{
      type: 'command',
      command: `node ${path.join(pluginDir, 'hooks', scriptName)}`,
    }],
  };
}

// Merge hook entries — remove any existing entry for this command, then append
const hookDefs = [
  ['UserPromptSubmit', 'user-prompt-submit.js'],
  ['PostToolUse', 'post-tool-use.js'],
  ['Notification', 'notification.js'],
  ['Stop', 'stop.js'],
];

for (const [event, scriptName] of hookDefs) {
  const entry = hookEntry(scriptName);
  const cmd = entry.hooks[0].command;
  const existing = (settings.hooks[event] || []).filter(
    (h) => !h.hooks?.some((c) => c.command === cmd)
  );
  settings.hooks[event] = [...existing, entry];
}

// Ensure .claude/ directory exists
const claudeDir = path.dirname(settingsPath);
if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log('✓ Hooks registered in .claude/settings.json');
console.log('  UserPromptSubmit →', path.join(pluginDir, 'hooks/user-prompt-submit.js'));
console.log('  PostToolUse →', path.join(pluginDir, 'hooks/post-tool-use.js'));
console.log('  Notification →', path.join(pluginDir, 'hooks/notification.js'));
console.log('  Stop →', path.join(pluginDir, 'hooks/stop.js'));
