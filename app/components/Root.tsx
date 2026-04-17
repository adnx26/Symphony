import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DetailPanel } from './DetailPanel';
import { LoadingSplash } from './LoadingSplash';
import { AgentStatusBar } from './AgentStatusBar';
import { BlockerModal } from './BlockerModal';
import { AppProvider, useApp } from '../context/AppContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useOrchestrationAgent } from '../agent/useOrchestrationAgent';
import { ProjectSetupData } from '../types';

// ── Demo data injector ────────────────────────────────────────────────────────
// Bypasses the LLM wizard and immediately seeds a realistic sample project.
// Swap this out once the proxy server is stable.

// Sample project: "Launchpad" — a small SaaS onboarding feature
// Real named developers, agents, and sub-agents all wired to tasks
const DEMO_DATA: ProjectSetupData = {
  developers: [
    { id: 'dev-1', name: 'Sarah Chen',   initials: 'SC', role: 'Tech Lead',        desc: 'Leads architecture decisions and reviews all PRs before merge.' },
    { id: 'dev-2', name: 'Marcus Reyes', initials: 'MR', role: 'Backend Engineer', desc: 'Owns API design and database layer.' },
    { id: 'dev-3', name: 'Priya Nair',   initials: 'PN', role: 'Frontend Engineer',desc: 'Builds React UI and owns the design system.' },
  ],
  agents: [
    { id: 'agt-1', name: 'CodeBot',    type: 'Code Review',  developerId: 'dev-1', desc: 'Reviews PRs, flags issues, suggests improvements. Managed by Sarah.' },
    { id: 'agt-2', name: 'QA-7',       type: 'QA',           developerId: 'dev-2', desc: 'Generates and runs integration tests against the API. Managed by Marcus.' },
    { id: 'agt-3', name: 'DeployBot',  type: 'DevOps',       developerId: 'dev-1', desc: 'Handles CI/CD, staging deploys, and infra config. Managed by Sarah.' },
  ],
  subAgents: [
    { id: 'sa-1', name: 'LintBot',    type: 'Linter',       parentId: 'agt-1', desc: 'Runs ESLint and Prettier on every PR.' },
    { id: 'sa-2', name: 'CoverageBot',type: 'Coverage',     parentId: 'agt-2', desc: 'Measures test coverage and fails PRs below 80%.' },
    { id: 'sa-3', name: 'StageBot',   type: 'Deploy',       parentId: 'agt-3', desc: 'Executes the staging deployment pipeline.' },
  ],
  tasks: [
    {
      title: 'Define onboarding requirements',
      desc: 'Sarah writes the PRD for the new user onboarding flow: welcome email, setup wizard, and first-run checklist.',
      status: 'done',
      priority: 'high',
      dueDate: '2026-04-10',
      developerId: 'dev-1',
      criteria: [
        'User stories written for all 3 onboarding steps',
        'Acceptance criteria defined per story',
        'Signed off by product and engineering',
      ],
    },
    {
      title: 'Build onboarding API',
      desc: 'Marcus implements POST /onboarding/start, PATCH /onboarding/step, GET /onboarding/status. QA-7 is writing tests in parallel.',
      status: 'progress',
      priority: 'critical',
      dueDate: '2026-04-21',
      developerId: 'dev-2',
      criteria: [
        'POST /onboarding/start creates session',
        'PATCH /onboarding/step validates transitions',
        'GET /onboarding/status returns correct state',
        'QA-7 integration tests passing',
      ],
    },
    {
      title: 'Build onboarding UI',
      desc: 'Priya builds the React wizard component. CodeBot is reviewing her PR — LintBot flagged 3 style issues already resolved.',
      status: 'progress',
      priority: 'high',
      dueDate: '2026-04-23',
      developerId: 'dev-3',
      criteria: [
        'Welcome screen rendered',
        'Setup wizard 3-step flow complete',
        'First-run checklist component done',
        'CodeBot PR review approved',
        'Responsive on mobile',
      ],
    },
    {
      title: 'Security review',
      desc: 'Sarah must manually audit the onboarding session tokens and rate limiting before deploy. CodeBot cannot handle this.',
      status: 'todo',
      priority: 'critical',
      dueDate: '2026-04-25',
      developerId: 'dev-1',
      criteria: [
        'Session token expiry verified',
        'Rate limiting on /onboarding/start',
        'No PII leaked in API responses',
        'Sign-off from Sarah',
      ],
    },
    {
      title: 'Deploy onboarding to staging',
      desc: 'DeployBot ready to deploy but blocked: Sarah has not approved the staging env config. StageBot is queued and waiting.',
      status: 'blocked',
      priority: 'critical',
      dueDate: '2026-04-22',
      agentId: 'agt-3',
      criteria: [
        'Sarah approves env config',
        'Secrets injected into CI',
        'StageBot runs deployment pipeline',
        'Smoke tests pass',
      ],
    },
  ],
};

function DemoInjector({ onComplete }: { onComplete: (data: ProjectSetupData) => Promise<void> }) {
  useEffect(() => {
    onComplete(DEMO_DATA);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--border)', borderTopColor: '#7c3aed' }}
      />
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Setting up project…
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function RootContent() {
  const {
    panelStack, closePanel, loading: dataLoading, dbError, allTasks, updateTaskStatus,
    setupComplete, setSetupComplete, injectSetupData, activeProject,
  } = useApp();
  const [timerDone, setTimerDone] = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [blockerTaskId, setBlockerTaskId] = useState<string | null>(null);
  const blockerTask = allTasks.find(t => t.id === blockerTaskId) ?? null;

  // Keyboard shortcuts
  useKeyboardShortcuts(() => {
    if (panelStack.length > 0) {
      closePanel();
    }
  });

  // Hide loading splash after mount
  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const { queue, log, getSnapshot } = useOrchestrationAgent();
  const snapshot = getSnapshot();

  const showSplash = !timerDone || dataLoading;

  return (
    <>
      {showSplash && <LoadingSplash />}

      {dbError && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: '#ffffff' }}>
          <div className="text-center p-8">
            <p className="text-sm font-medium mb-1" style={{ color: '#be123c' }}>Failed to connect to database</p>
            <p className="text-xs" style={{ color: '#a1a1aa' }}>{dbError}</p>
          </div>
        </div>
      )}

      <div className="h-screen w-screen overflow-hidden relative" style={{ background: '#ffffff' }}>
        {/* Main content */}
        <div className="relative h-full flex flex-col">
          <Header
            agentPanelOpen={agentPanelOpen}
            setAgentPanelOpen={setAgentPanelOpen}
            onOpenBlocker={setBlockerTaskId}
            allTasks={allTasks}
          />
          <AgentStatusBar
            queueCount={queue.length}
            blockedCount={snapshot.blockedTasks.length}
            overdueCount={snapshot.overdueTasks.length}
            lastActionTime={log.length > 0 ? log[0].timestamp : null}
            onOpenPanel={() => setAgentPanelOpen(true)}
          />

          <div className="flex-1 flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-hidden">
              <Outlet context={{}} />
            </main>
          </div>
        </div>

        {/* Detail panel */}
        {panelStack.length > 0 && <DetailPanel />}
      </div>

      <AnimatePresence>
        {!setupComplete && activeProject && (
          <DemoInjector key="demo-injector" onComplete={injectSetupData} />
        )}
        {blockerTask && (
          <BlockerModal
            key="blocker-modal"
            task={blockerTask}
            onSave={(taskId, reason) => {
              updateTaskStatus(taskId, 'blocked', reason);
              setBlockerTaskId(null);
            }}
            onResolve={(taskId) => {
              updateTaskStatus(taskId, 'progress');
              setBlockerTaskId(null);
            }}
            onClose={() => setBlockerTaskId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export function Root() {
  return (
    <AppProvider>
      <RootContent />
    </AppProvider>
  );
}