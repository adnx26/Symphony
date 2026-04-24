'use strict';

const PHASE_MAP = {
  Read: 'exploring',
  Grep: 'exploring',
  Glob: 'exploring',
  LS: 'exploring',
  Edit: 'implementing',
  Write: 'implementing',
  Bash: 'running',
  AskUserQuestion: 'waiting',
};

function detectPhase(toolName, toolResponse) {
  if (!toolName) return 'communicating';
  if (toolResponse && toolResponse.is_error === true) return 'debugging';
  return PHASE_MAP[toolName] ?? 'communicating';
}

function extractTaskId(text) {
  if (!text) return null;
  const tagMatch = text.match(/#(t\d+)/i);
  if (tagMatch) return tagMatch[1].toLowerCase();
  const declareMatch = text.match(/working\s+on\s+task\s+(\w+)/i);
  if (declareMatch) return declareMatch[1].toLowerCase();
  return null;
}

function buildSummary(toolName, toolInput, toolResponse) {
  if (!toolName) return 'Claude sent a message';
  switch (toolName) {
    case 'Bash':
      return `Ran: ${String(toolInput?.command ?? '').slice(0, 80)}`;
    case 'Read':
      return `Read ${toolInput?.file_path ?? 'file'}`;
    case 'Edit':
      return `Edited ${toolInput?.file_path ?? 'file'}`;
    case 'Write':
      return `Wrote ${toolInput?.file_path ?? 'file'}`;
    case 'Grep':
      return `Searched for "${String(toolInput?.pattern ?? '').slice(0, 60)}"`;
    case 'Glob':
      return `Scanned ${toolInput?.pattern ?? ''}`;
    case 'LS':
      return `Listed ${toolInput?.path ?? 'directory'}`;
    case 'AskUserQuestion':
      return `Asked: ${String(toolInput?.question ?? '').slice(0, 80)}`;
    default:
      return `Used ${toolName}`;
  }
}

module.exports = { detectPhase, extractTaskId, buildSummary };
