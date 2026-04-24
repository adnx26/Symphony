const { test } = require('node:test');
const assert = require('node:assert/strict');
const { detectPhase, extractTaskId, buildSummary } = require('../lib/parse-context');

// detectPhase
test('Read tool returns exploring', () => {
  assert.equal(detectPhase('Read', {}), 'exploring');
});

test('Grep tool returns exploring', () => {
  assert.equal(detectPhase('Grep', {}), 'exploring');
});

test('Glob tool returns exploring', () => {
  assert.equal(detectPhase('Glob', {}), 'exploring');
});

test('LS tool returns exploring', () => {
  assert.equal(detectPhase('LS', {}), 'exploring');
});

test('Edit tool returns implementing', () => {
  assert.equal(detectPhase('Edit', {}), 'implementing');
});

test('Write tool returns implementing', () => {
  assert.equal(detectPhase('Write', {}), 'implementing');
});

test('Bash tool returns running', () => {
  assert.equal(detectPhase('Bash', {}), 'running');
});

test('AskUserQuestion returns waiting', () => {
  assert.equal(detectPhase('AskUserQuestion', {}), 'waiting');
});

test('is_error true returns debugging', () => {
  assert.equal(detectPhase('Bash', { is_error: true }), 'debugging');
});

test('unknown tool returns communicating', () => {
  assert.equal(detectPhase('UnknownTool', {}), 'communicating');
});

test('null toolName returns communicating', () => {
  assert.equal(detectPhase(null, {}), 'communicating');
});

// extractTaskId
test('extracts #t3 tag', () => {
  assert.equal(extractTaskId('working on #t3 now'), 't3');
});

test('extracts #t12 tag', () => {
  assert.equal(extractTaskId('see ticket #t12'), 't12');
});

test('extracts "working on task t5" declaration', () => {
  assert.equal(extractTaskId('I am working on task t5 today'), 't5');
});

test('returns null when no task ID', () => {
  assert.equal(extractTaskId('just exploring the codebase'), null);
});

test('returns null for empty string', () => {
  assert.equal(extractTaskId(''), null);
});

test('returns null for null input', () => {
  assert.equal(extractTaskId(null), null);
});

// buildSummary
test('Bash summary shows command', () => {
  const s = buildSummary('Bash', { command: 'npm test' }, {});
  assert.ok(s.includes('npm test'));
});

test('Read summary shows file path', () => {
  const s = buildSummary('Read', { file_path: 'app/types.ts' }, {});
  assert.ok(s.includes('app/types.ts'));
});

test('Edit summary shows file path', () => {
  const s = buildSummary('Edit', { file_path: 'app/types.ts' }, {});
  assert.ok(s.includes('app/types.ts'));
});

test('unknown tool returns generic summary', () => {
  const s = buildSummary('Mystery', {}, {});
  assert.ok(s.includes('Mystery'));
});
