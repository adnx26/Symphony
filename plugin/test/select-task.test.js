'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findTask } = require('../select-task');

const TASKS = [
  { id: 't1', title: 'Build Auth API', status: 'progress' },
  { id: 't2', title: 'Design System', status: 'todo' },
  { id: 't3', title: 'DB Migration', status: 'blocked' },
];

test('findTask returns matching task', () => {
  assert.deepEqual(findTask(TASKS, 't2'), TASKS[1]);
});

test('findTask returns null for unknown id', () => {
  assert.equal(findTask(TASKS, 't99'), null);
});

test('findTask returns null for empty array', () => {
  assert.equal(findTask([], 't1'), null);
});

test('findTask is case-sensitive', () => {
  assert.equal(findTask(TASKS, 'T1'), null);
});
