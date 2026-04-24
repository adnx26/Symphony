'use strict';

const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, '../.session-state.json');

/** @returns {{ session_id: string|null, active_task_id: string|null }} */
function getState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
  } catch {
    return { session_id: null, active_task_id: null };
  }
}

/** @param {{ session_id: string|null, active_task_id: string|null }} state */
function setState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

module.exports = { getState, setState };
