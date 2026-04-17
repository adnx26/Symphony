// app/agent/agentRegistry.ts
// Pure TypeScript — no React, no hooks.
// Defines agent capabilities and simulated behaviors.

import { AppTask, AgentDispatchResult } from '../types';

export interface AgentCapability {
  agentId: string;
  name: string;
  type: string;
  description: string;
  inputSchema: Record<string, string>;
  simulate: (
    task: AppTask,
    input: Record<string, unknown>
  ) => Promise<AgentDispatchResult>;
}

function makeResult(
  dispatchId: string,
  agentId: string,
  taskId: string,
  output: Record<string, unknown>
): AgentDispatchResult {
  return {
    dispatchId,
    agentId,
    taskId,
    status: 'completed',
    output,
    completedAt: new Date().toISOString(),
  };
}

function randomDelay(): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, 2000 + Math.random() * 3000)
  );
}

const codeBotCapability: AgentCapability = {
  agentId: 'a1',
  name: 'CodeBot',
  type: 'Code Review',
  description: 'Performs automated code review, security scanning, and coverage analysis.',
  inputSchema: {
    branch: 'Git branch to review',
    scope: 'Files or directories to focus on',
  },
  simulate: async (task, input) => {
    const dispatchId = (input.__dispatchId as string) ?? crypto.randomUUID();
    await randomDelay();
    return makeResult(dispatchId, 'a1', task.id, {
      reviewSummary: `Code review complete for "${task.title}"`,
      issuesFound: Math.floor(Math.random() * 5),
      securityFlags: Math.floor(Math.random() * 2),
      coverageDelta: `+${Math.floor(Math.random() * 10)}%`,
      approved: Math.random() > 0.3,
    });
  },
};

const qa7Capability: AgentCapability = {
  agentId: 'a2',
  name: 'QA-7',
  type: 'QA',
  description: 'Generates and runs test cases, evaluates quality metrics, and flags regressions.',
  inputSchema: {
    testSuite: 'Test suite identifier',
    environment: 'Target environment (staging, prod)',
  },
  simulate: async (task, input) => {
    const dispatchId = (input.__dispatchId as string) ?? crypto.randomUUID();
    await randomDelay();
    return makeResult(dispatchId, 'a2', task.id, {
      testSummary: `QA analysis complete for "${task.title}"`,
      testCasesGenerated: Math.floor(Math.random() * 8) + 4,
      passRate: `${Math.floor(Math.random() * 20) + 80}%`,
      criticalIssues: Math.floor(Math.random() * 2),
      blocked: Math.random() > 0.8,
    });
  },
};

const deployBotCapability: AgentCapability = {
  agentId: 'a3',
  name: 'DeployBot',
  type: 'DevOps',
  description: 'Handles CI/CD pipeline execution, staging deploys, and health checks.',
  inputSchema: {
    environment: 'Deployment target (staging, canary, prod)',
    version: 'Artifact version or commit SHA',
  },
  simulate: async (task, input) => {
    const dispatchId = (input.__dispatchId as string) ?? crypto.randomUUID();
    await randomDelay();
    return makeResult(dispatchId, 'a3', task.id, {
      deploymentSummary: `Deployment check for "${task.title}"`,
      buildStatus: Math.random() > 0.2 ? 'passed' : 'failed',
      buildTime: `${Math.floor(Math.random() * 3) + 1}m ${Math.floor(Math.random() * 59)}s`,
      stagingUrl: `https://staging-${task.id}.symphony.dev`,
      healthChecks: Math.random() > 0.1 ? 'all green' : '1 failing',
    });
  },
};

const designAICapability: AgentCapability = {
  agentId: 'a4',
  name: 'DesignAI',
  type: 'Design',
  description: 'Generates UI screens, applies design tokens, and runs accessibility audits.',
  inputSchema: {
    component: 'Component or screen name',
    tokens: 'Design token set to apply',
  },
  simulate: async (task, input) => {
    const dispatchId = (input.__dispatchId as string) ?? crypto.randomUUID();
    await randomDelay();
    return makeResult(dispatchId, 'a4', task.id, {
      designSummary: `Design analysis for "${task.title}"`,
      screensCompleted: Math.floor(Math.random() * 3) + 1,
      tokensApplied: Math.random() > 0.2,
      accessibilityScore: `${Math.floor(Math.random() * 20) + 80}/100`,
      figmaUrl: `https://figma.com/file/symphony-${task.id}`,
    });
  },
};

export const AGENT_REGISTRY = new Map<string, AgentCapability>([
  ['a1', codeBotCapability],
  ['a2', qa7Capability],
  ['a3', deployBotCapability],
  ['a4', designAICapability],
]);
