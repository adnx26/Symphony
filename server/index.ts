import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('❌ ANTHROPIC_API_KEY is not set in .env — server will not be able to call Claude');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

app.post('/api/agent/analyze', async (req, res) => {
  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const timeout = setTimeout(() => {
      if (!res.headersSent) res.status(504).json({ error: 'Request timed out' });
    }, 30_000);

    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    clearTimeout(timeout);
    if (res.headersSent) return;

    const text = message.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    res.json({ text });
  } catch (err) {
    console.error('LLM proxy error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'LLM request failed' });
  }
});

app.post('/api/project/setup', async (req, res) => {
  const timeout = setTimeout(() => {
    if (!res.headersSent) res.status(504).json({ error: 'Request timed out' });
  }, 60_000);

  try {
    const { messages, projectContext } = req.body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      projectContext: {
        projectName: string;
        existingTasks: number;
        existingDevelopers: number;
      };
    };

    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `You are a project setup assistant for Symphony PM, a software project management tool. The user has described their project "${projectContext.projectName}" in a single message. Generate an initial task list immediately.

WHAT TO GENERATE:
- Tasks: 4-8 realistic software development tasks with title, description, priority (low/medium/high/critical), status (always 'todo'), due dates, and 3-6 acceptance criteria each

IMPORTANT RULES:
- Generate realistic, specific tasks based on the user's description — not generic placeholders
- Due dates should be 1-4 weeks from today (${today})
- Always output the PROJECT_DATA block — this is required

OUTPUT FORMAT:
Write a single brief sentence acknowledging the project, then output the JSON block:

<PROJECT_DATA>
{
  "tasks": [
    {
      "title": "string",
      "desc": "string",
      "status": "todo",
      "priority": "low|medium|high|critical",
      "dueDate": "YYYY-MM-DD",
      "criteria": ["criterion 1", "criterion 2"]
    }
  ]
}
</PROJECT_DATA>`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    const dataMatch = text.match(/<PROJECT_DATA>([\s\S]*?)<\/PROJECT_DATA>/);
    let projectData = null;
    if (dataMatch) {
      try {
        projectData = JSON.parse(dataMatch[1].trim());
      } catch {
        console.error('Failed to parse PROJECT_DATA');
      }
    }

    const cleanText = text.replace(/<PROJECT_DATA>[\s\S]*?<\/PROJECT_DATA>/, '').trim();

    clearTimeout(timeout);
    if (!res.headersSent) res.json({ text: cleanText, projectData });
  } catch (err) {
    clearTimeout(timeout);
    console.error('Project setup error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Setup request failed' });
  }
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Symphony agent proxy running on http://localhost:${PORT}`);
});
