// app/agent/llmEngine.ts
// Calls the local Express proxy at /api/agent/analyze
// API key lives server-side only — never in the client bundle

import { AppTask, AppDeveloper, AppAgent, AgentAction } from '../types';

export interface LLMSnapshot {
  tasks: AppTask[];
  developers: AppDeveloper[];
  agents: AppAgent[];
  today: string;
}

function buildPrompt(snapshot: LLMSnapshot): string {
  const blocked = snapshot.tasks.filter(t => t.status === 'blocked');
  const overdue = snapshot.tasks.filter(
    t => t.dueDate && t.dueDate < snapshot.today && t.status !== 'done'
  );
  const inProgress = snapshot.tasks.filter(t => t.status === 'progress');

  return `You are an AI project management orchestration agent analyzing a
software team's current workload. Today is ${snapshot.today}.

TEAM:
${snapshot.developers.map(d => `- ${d.name} (${d.role})`).join('\n')}

AGENTS:
${snapshot.agents.map(a => `- ${a.name} (${a.type})`).join('\n')}

BLOCKED TASKS (${blocked.length}):
${blocked.map(t =>
  `- [${t.id}] ${t.title} | priority: ${t.priority} | reason: ${t.blockerReason ?? 'none'}`
).join('\n') || 'None'}

OVERDUE TASKS (${overdue.length}):
${overdue.map(t =>
  `- [${t.id}] ${t.title} | priority: ${t.priority} | due: ${t.dueDate}`
).join('\n') || 'None'}

IN PROGRESS (${inProgress.length}):
${inProgress.map(t =>
  `- [${t.id}] ${t.title} | priority: ${t.priority} | assignee: ${t.developerId}`
).join('\n') || 'None'}

Analyze the above and return a JSON array of action objects. Each action must
have this exact shape:
{
  "type": "LLM_INSIGHT",
  "payload": {
    "taskId": "<task id or null if team-level>",
    "insight": "<one sentence, max 120 chars>",
    "recommendation": "<one concrete action the team should take>"
  }
}

Return ONLY the JSON array. No explanation, no markdown, no code fences.
Maximum 5 insights. Focus on the highest-impact issues only.`;
}

const PROXY_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api/agent/analyze'
  : '/api/agent/analyze';

export async function runLLMEngine(
  snapshot: LLMSnapshot
): Promise<AgentAction[]> {
  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: buildPrompt(snapshot) }),
    });

    if (!res.ok) return [];

    const { text } = await res.json() as { text: string };
    const parsed = JSON.parse(text) as Array<{
      type: string;
      payload: Record<string, unknown>;
    }>;

    return parsed.map(a => ({
      type: a.type,
      payload: a.payload,
      timestamp: new Date().toISOString(),
      agentId: 'llm-orchestrator',
    }));
  } catch (err) {
    console.warn('LLM engine failed, falling back to rule engine only:', err);
    return [];
  }
}
