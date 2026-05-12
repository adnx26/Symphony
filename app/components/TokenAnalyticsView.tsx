import { useMemo, useState, type ReactNode } from 'react';
import { BarChart3, Coins, Gauge, Target, TrendingUp, WandSparkles } from 'lucide-react';

type PromptStatus = 'Exploration' | 'Partial' | 'Improved' | 'Correct' | 'Refinement';

interface PromptSeriesPoint {
  prompt: number;
  tokens: number;
  outputScore: number;
  notes: string;
}

interface TicketAnalytics {
  ticketId: string;
  ticketTitle: string;
  totalTokens: number;
  totalPrompts: number;
  promptsUntilCorrect: number;
  estimatedCost: number;
  avgTokensPerPrompt: number;
  finalOutputScore: number;
  model: string;
  highestTokenPrompt: number;
  lowestTokenPrompt: number;
  promptSeries: PromptSeriesPoint[];
  insights: string[];
  recommendation: string[];
}

const TOKEN_ANALYTICS_DATA: Record<string, TicketAnalytics> = {
  t1: {
    ticketId: 't1',
    ticketTitle: 'Build Claude terminal plugin',
    totalTokens: 48250,
    totalPrompts: 11,
    promptsUntilCorrect: 8,
    estimatedCost: 14.48,
    avgTokensPerPrompt: 4386,
    finalOutputScore: 100,
    model: 'Claude Sonnet',
    highestTokenPrompt: 7200,
    lowestTokenPrompt: 1850,
    promptSeries: [
      { prompt: 1, tokens: 1850, outputScore: 42, notes: 'Mapped plugin scaffolding and command shape.' },
      { prompt: 2, tokens: 2400, outputScore: 51, notes: 'First implementation pass with incomplete terminal wiring.' },
      { prompt: 3, tokens: 3900, outputScore: 57, notes: 'Expanded runtime and permission handling.' },
      { prompt: 4, tokens: 4200, outputScore: 63, notes: 'Resolved shell/session state issues.' },
      { prompt: 5, tokens: 6100, outputScore: 71, notes: 'Added command execution flow and terminal sync.' },
      { prompt: 6, tokens: 5300, outputScore: 76, notes: 'Debugging edge cases around PTY output.' },
      { prompt: 7, tokens: 7200, outputScore: 84, notes: 'Large refinement pass for plugin ergonomics.' },
      { prompt: 8, tokens: 6800, outputScore: 92, notes: 'Correct final output reached with stable behavior.' },
      { prompt: 9, tokens: 4100, outputScore: 94, notes: 'Refined docs and reduced ambiguity.' },
      { prompt: 10, tokens: 3300, outputScore: 95, notes: 'Polished UI messaging and edge handling.' },
      { prompt: 11, tokens: 3100, outputScore: 100, notes: 'Final cleanup and consistency pass.' },
    ],
    insights: [
      'Most tokens were spent during debugging and workflow refinement after the implementation path was already clear.',
      'Correct output was reached after 8 prompts, with quality climbing sharply from prompt 5 onward.',
      'Later prompts preserved quality but continued to add cost without lifting the final score.',
    ],
    recommendation: [
      'Compress context after prompt 6 to reduce repeated token usage.',
      'Use clearer acceptance criteria before running the agent.',
    ],
  },
  t2: {
    ticketId: 't2',
    ticketTitle: 'ClaudeStatusBar component',
    totalTokens: 36700,
    totalPrompts: 9,
    promptsUntilCorrect: 6,
    estimatedCost: 11.01,
    avgTokensPerPrompt: 4078,
    finalOutputScore: 100,
    model: 'Claude Sonnet',
    highestTokenPrompt: 6400,
    lowestTokenPrompt: 1600,
    promptSeries: [
      { prompt: 1, tokens: 1600, outputScore: 46, notes: 'Reviewed event model and current footer behavior.' },
      { prompt: 2, tokens: 2500, outputScore: 54, notes: 'Drafted initial status bar with idle state.' },
      { prompt: 3, tokens: 3700, outputScore: 62, notes: 'Connected realtime session state.' },
      { prompt: 4, tokens: 5100, outputScore: 71, notes: 'Adjusted lifecycle timing and formatting.' },
      { prompt: 5, tokens: 6400, outputScore: 81, notes: 'Handled Supabase guardrails and visual polish.' },
      { prompt: 6, tokens: 5900, outputScore: 88, notes: 'Correct output reached with stable activity display.' },
      { prompt: 7, tokens: 4300, outputScore: 88, notes: 'Refinement pass for copy and idle handling.' },
      { prompt: 8, tokens: 3800, outputScore: 88, notes: 'Tightened layout and token labels.' },
      { prompt: 9, tokens: 3400, outputScore: 88, notes: 'Final consistency and testing pass.' },
    ],
    insights: [
      'A mid-run debugging spike drove the largest token jump while wiring realtime state safely.',
      'Correct output arrived by prompt 6, earlier than the heavier integration tasks around it suggested.',
      'Post-correct prompts focused mostly on visual refinement and defensive UX.' ,
    ],
    recommendation: [
      'Predefine fallback states before implementation to reduce validation prompts.',
      'Stop after prompt 6 for demo builds unless wording or visual polish is still required.',
    ],
  },
  t3: {
    ticketId: 't3',
    ticketTitle: 'SessionLog view',
    totalTokens: 52900,
    totalPrompts: 13,
    promptsUntilCorrect: 10,
    estimatedCost: 15.87,
    avgTokensPerPrompt: 4069,
    finalOutputScore: 90,
    model: 'Claude Sonnet',
    highestTokenPrompt: 7900,
    lowestTokenPrompt: 2100,
    promptSeries: [
      { prompt: 1, tokens: 2100, outputScore: 40, notes: 'Explored event structures and empty states.' },
      { prompt: 2, tokens: 2700, outputScore: 47, notes: 'Outlined list presentation and navigation.' },
      { prompt: 3, tokens: 3600, outputScore: 52, notes: 'Connected history rendering.' },
      { prompt: 4, tokens: 4100, outputScore: 59, notes: 'Added labels and tool markers.' },
      { prompt: 5, tokens: 4800, outputScore: 63, notes: 'Improved timestamps and loading logic.' },
      { prompt: 6, tokens: 5300, outputScore: 69, notes: 'Addressed data absence and realtime state.' },
      { prompt: 7, tokens: 6200, outputScore: 74, notes: 'Refined card structure and summaries.' },
      { prompt: 8, tokens: 7900, outputScore: 82, notes: 'Heavy debugging pass for event phases and edge cases.' },
      { prompt: 9, tokens: 5600, outputScore: 86, notes: 'Stabilized final card hierarchy.' },
      { prompt: 10, tokens: 4900, outputScore: 90, notes: 'Correct output reached with accurate session timeline.' },
      { prompt: 11, tokens: 3600, outputScore: 90, notes: 'Accessibility and spacing pass.' },
      { prompt: 12, tokens: 3200, outputScore: 90, notes: 'Reduced copy noise in empty states.' },
      { prompt: 13, tokens: 2900, outputScore: 90, notes: 'Final demo polish.' },
    ],
    insights: [
      'The largest token spike appeared late, when debugging phase labeling and realtime cases simultaneously.',
      'Correct output required 10 prompts because the data presentation depended on several state conditions.',
      'The last three prompts improved presentation quality more than functional quality.',
    ],
    recommendation: [
      'Front-load a sample event schema before implementation.',
      'Trim historical context after the largest debugging pass to keep later prompts cheaper.',
    ],
  },
  t4: {
    ticketId: 't4',
    ticketTitle: 'Tickets-first MVP — hide board',
    totalTokens: 22180,
    totalPrompts: 6,
    promptsUntilCorrect: 4,
    estimatedCost: 6.65,
    avgTokensPerPrompt: 3697,
    finalOutputScore: 86,
    model: 'Claude Sonnet',
    highestTokenPrompt: 5200,
    lowestTokenPrompt: 1450,
    promptSeries: [
      { prompt: 1, tokens: 1450, outputScore: 48, notes: 'Reviewed route behavior and initial UI expectations.' },
      { prompt: 2, tokens: 2900, outputScore: 61, notes: 'Adjusted default navigation and tab assumptions.' },
      { prompt: 3, tokens: 5200, outputScore: 74, notes: 'Refined shell to emphasize tickets-first workflow.' },
      { prompt: 4, tokens: 4700, outputScore: 86, notes: 'Correct output reached with board deprioritized cleanly.' },
      { prompt: 5, tokens: 4100, outputScore: 86, notes: 'Refinement pass for copy and layout balance.' },
      { prompt: 6, tokens: 3830, outputScore: 86, notes: 'Final cleanup.' },
    ],
    insights: [
      'This ticket converged quickly because the functional change was mostly presentation and route emphasis.',
      'The correct output landed by prompt 4 with only minor cleanup afterward.',
      'Most wasted tokens came from extra polish after the MVP behavior was already correct.',
    ],
    recommendation: [
      'Use a tighter acceptance definition for MVP-only changes.',
      'Stop after prompt 4 when the goal is purely workflow reprioritization.',
    ],
  },
  t5: {
    ticketId: 't5',
    ticketTitle: 'Redesign sample data',
    totalTokens: 29460,
    totalPrompts: 7,
    promptsUntilCorrect: 5,
    estimatedCost: 8.84,
    avgTokensPerPrompt: 4209,
    finalOutputScore: 89,
    model: 'Claude Sonnet',
    highestTokenPrompt: 6100,
    lowestTokenPrompt: 1900,
    promptSeries: [
      { prompt: 1, tokens: 1900, outputScore: 43, notes: 'Reviewed existing sample data shape and coverage gaps.' },
      { prompt: 2, tokens: 3100, outputScore: 56, notes: 'Expanded data realism and naming consistency.' },
      { prompt: 3, tokens: 4700, outputScore: 66, notes: 'Balanced developer, task, and agent relationships.' },
      { prompt: 4, tokens: 6100, outputScore: 79, notes: 'Resolved edge-case IDs and cross-view consistency.' },
      { prompt: 5, tokens: 5600, outputScore: 89, notes: 'Correct output reached with usable demo dataset.' },
      { prompt: 6, tokens: 4300, outputScore: 89, notes: 'Refinement pass for story/epic details.' },
      { prompt: 7, tokens: 3760, outputScore: 89, notes: 'Final polish and cleanup.' },
    ],
    insights: [
      'Token spend clustered around relational consistency checks rather than raw content generation.',
      'Correct output arrived at prompt 5 once the sample hierarchy became internally consistent.',
      'Later prompts improved polish for demos but did not lift the measurable output score.',
    ],
    recommendation: [
      'Document required sample-data relationships before editing.',
      'Snapshot a target schema early to reduce repeated validation prompts.',
    ],
  },
  t6: {
    ticketId: 't6',
    ticketTitle: 'Supabase real-time AI indicator',
    totalTokens: 44620,
    totalPrompts: 10,
    promptsUntilCorrect: 7,
    estimatedCost: 13.39,
    avgTokensPerPrompt: 4462,
    finalOutputScore: 91,
    model: 'Claude Sonnet',
    highestTokenPrompt: 7050,
    lowestTokenPrompt: 1750,
    promptSeries: [
      { prompt: 1, tokens: 1750, outputScore: 44, notes: 'Scoped realtime indicator goals and environment checks.' },
      { prompt: 2, tokens: 2600, outputScore: 50, notes: 'Outlined subscription and fallback behavior.' },
      { prompt: 3, tokens: 4200, outputScore: 60, notes: 'Connected event stream and task awareness.' },
      { prompt: 4, tokens: 5100, outputScore: 69, notes: 'Handled inactive sessions and null states.' },
      { prompt: 5, tokens: 7050, outputScore: 78, notes: 'Debugged realtime lifecycle and UI race conditions.' },
      { prompt: 6, tokens: 6200, outputScore: 85, notes: 'Stabilized timing and display logic.' },
      { prompt: 7, tokens: 5900, outputScore: 91, notes: 'Correct output reached with accurate live indicator.' },
      { prompt: 8, tokens: 4300, outputScore: 91, notes: 'Refinement pass for dark UI polish.' },
      { prompt: 9, tokens: 3600, outputScore: 91, notes: 'Reduced state noise and guard duplication.' },
      { prompt: 10, tokens: 3920, outputScore: 91, notes: 'Final demo-hardening pass.' },
    ],
    insights: [
      'Realtime behavior created the highest debugging cost of any selected demo ticket.',
      'Prompt quality improved steadily after the subscription model was stabilized.',
      'The last three prompts mostly hardened the demo and increased confidence, not core correctness.',
    ],
    recommendation: [
      'Introduce a mocked realtime event timeline earlier for validation.',
      'Reuse a standard subscription helper to cut repeated debugging context.',
    ],
  },
};

const TICKET_OPTIONS = Object.values(TOKEN_ANALYTICS_DATA).map(({ ticketId, ticketTitle }) => ({
  id: ticketId,
  label: `${ticketId} — ${ticketTitle}`,
}));

function getPromptStatus(prompt: number, promptsUntilCorrect: number): PromptStatus {
  if (prompt === promptsUntilCorrect) return 'Correct';
  if (prompt > promptsUntilCorrect) return 'Refinement';
  if (prompt <= 2) return 'Exploration';
  if (prompt <= promptsUntilCorrect - 2) return 'Partial';
  return 'Improved';
}

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function formatCompactCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export function TokenAnalyticsView() {
  const [selectedTicketId, setSelectedTicketId] = useState<string>('t1');

  const analytics = TOKEN_ANALYTICS_DATA[selectedTicketId];

  const derived = useMemo(() => {
    const correctPrompt = analytics.promptSeries.find((point) => point.prompt === analytics.promptsUntilCorrect);
    const tokensAfterCorrect = analytics.promptSeries
      .filter((point) => point.prompt > analytics.promptsUntilCorrect)
      .reduce((sum, point) => sum + point.tokens, 0);
    const costPerToken = analytics.estimatedCost / analytics.totalTokens;
    const potentialSavings = tokensAfterCorrect * costPerToken;
    const costPerCorrectOutput = (correctPrompt?.tokens ?? 0) * costPerToken + (analytics.promptsUntilCorrect - 1) * 0.38;
    const efficiencyScore = Math.max(
      58,
      Math.min(
        96,
        Math.round((analytics.finalOutputScore * 0.72) + ((analytics.promptsUntilCorrect / analytics.totalPrompts) * 28))
      )
    );

    return {
      tokensAfterCorrect,
      potentialSavings,
      costPerCorrectOutput,
      efficiencyScore,
    };
  }, [analytics]);

  const tokenMax = Math.max(...analytics.promptSeries.map((point) => point.tokens));
  const scoreMax = 100;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, rgba(11,17,26,0.55), rgba(7,11,18,0.88))' }}
    >
      <div className="mx-auto max-w-7xl px-5 py-6">
        <div
          className="rounded-[24px] border p-5 md:p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(11,17,26,0.92), rgba(16,25,35,0.84))',
            borderColor: 'rgba(31, 43, 58, 0.95)',
            boxShadow: '0 20px 40px rgba(2, 6, 23, 0.28)',
          }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div
                className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem]"
                style={{
                  color: '#93c5fd',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Demo Analytics
              </div>
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
                Token Analytics
              </h1>
              <p className="mt-2 text-sm leading-6" style={{ color: '#94a3b8' }}>
                Track token usage, prompt efficiency, and AI iteration cost per ticket.
              </p>
            </div>

            <div className="w-full max-w-md">
              <label
                className="mb-2 block text-[0.68rem]"
                style={{
                  color: 'var(--text-subtle)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Ticket Selector
              </label>
              <div
                className="rounded-2xl border px-4 py-3"
                style={{
                  background: 'rgba(13, 21, 32, 0.92)',
                  borderColor: 'var(--border)',
                }}
              >
                <select
                  value={selectedTicketId}
                  onChange={(e) => setSelectedTicketId(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  style={{ color: 'var(--foreground)' }}
                >
                  {TICKET_OPTIONS.map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard icon={<Coins className="h-4 w-4" />} label="Total Tokens Used" value={formatNumber(analytics.totalTokens)} accent="rgba(59, 130, 246, 0.18)" tone="#60a5fa" />
          <MetricCard icon={<BarChart3 className="h-4 w-4" />} label="Avg Tokens / Prompt" value={formatNumber(analytics.avgTokensPerPrompt)} accent="rgba(139, 92, 246, 0.18)" tone="#a78bfa" />
          <MetricCard icon={<Target className="h-4 w-4" />} label="Prompts Until Correct" value={String(analytics.promptsUntilCorrect)} accent="rgba(20, 184, 166, 0.18)" tone="#2dd4bf" />
          <MetricCard icon={<TrendingUp className="h-4 w-4" />} label="Estimated Cost" value={formatCompactCurrency(analytics.estimatedCost)} accent="rgba(245, 158, 11, 0.16)" tone="#fbbf24" />
          <MetricCard icon={<Gauge className="h-4 w-4" />} label="Final Output Score" value={`${analytics.finalOutputScore}%`} accent="rgba(34, 197, 94, 0.16)" tone="#4ade80" />
          <MetricCard icon={<WandSparkles className="h-4 w-4" />} label="Model Used" value={analytics.model} accent="rgba(239, 71, 111, 0.16)" tone="#fb7185" />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="space-y-5">
            <ChartCard
              title="Token Usage Per Prompt"
              subtitle={`Peak prompt: ${formatNumber(analytics.highestTokenPrompt)} tokens · Lowest prompt: ${formatNumber(analytics.lowestTokenPrompt)} tokens`}
            >
              <div className="flex h-72 items-end gap-3 rounded-[18px] border px-4 pb-6 pt-4" style={{ borderColor: 'rgba(31,43,58,0.9)', background: 'linear-gradient(180deg, rgba(11,17,26,0.6), rgba(13,21,32,0.78))' }}>
                {analytics.promptSeries.map((point) => (
                  <div key={point.prompt} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-[0.63rem]" style={{ color: '#7b8494', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                      {Math.round(point.tokens / 1000)}k
                    </span>
                    <div className="flex h-52 items-end">
                      <div
                        className="w-full min-w-[22px] rounded-t-[12px] border border-b-0 transition-all"
                        style={{
                          height: `${(point.tokens / tokenMax) * 100}%`,
                          background: point.prompt === analytics.promptsUntilCorrect
                            ? 'linear-gradient(180deg, rgba(45,212,191,0.92), rgba(59,130,246,0.88))'
                            : 'linear-gradient(180deg, rgba(96,165,250,0.92), rgba(139,92,246,0.86))',
                          borderColor: point.prompt === analytics.promptsUntilCorrect ? 'rgba(45,212,191,0.6)' : 'rgba(96,165,250,0.28)',
                          boxShadow: point.prompt === analytics.promptsUntilCorrect ? '0 0 18px rgba(45, 212, 191, 0.16)' : '0 0 18px rgba(59, 130, 246, 0.08)',
                        }}
                        title={`Prompt ${point.prompt}: ${formatNumber(point.tokens)} tokens`}
                      />
                    </div>
                    <span className="text-[0.68rem]" style={{ color: '#94a3b8', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                      P{point.prompt}
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="Output Quality Over Iterations"
              subtitle={`Correct final output reached at prompt ${analytics.promptsUntilCorrect}`}
            >
              <div className="rounded-[18px] border px-4 pb-5 pt-4" style={{ borderColor: 'rgba(31,43,58,0.9)', background: 'linear-gradient(180deg, rgba(11,17,26,0.6), rgba(13,21,32,0.78))' }}>
                <div className="relative h-72">
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'rgba(49, 67, 85, 0.5)' }} />
                  <div className="absolute inset-x-0 top-1/4 h-px" style={{ background: 'rgba(49, 67, 85, 0.35)' }} />
                  <div className="absolute inset-x-0 top-2/4 h-px" style={{ background: 'rgba(49, 67, 85, 0.35)' }} />
                  <div className="absolute inset-x-0 top-3/4 h-px" style={{ background: 'rgba(49, 67, 85, 0.35)' }} />
                  <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'rgba(49, 67, 85, 0.5)' }} />

                  <div
                    className="absolute bottom-0 top-0 w-px"
                    style={{
                      left: `${((analytics.promptsUntilCorrect - 0.5) / analytics.promptSeries.length) * 100}%`,
                      background: 'linear-gradient(180deg, rgba(45,212,191,0), rgba(45,212,191,0.8), rgba(45,212,191,0))',
                    }}
                  />

                  <div className="absolute right-2 top-2 rounded-full px-2 py-1 text-[0.62rem]" style={{ background: 'rgba(20,184,166,0.14)', color: '#5eead4', border: '1px solid rgba(45,212,191,0.22)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                    Correct @ P{analytics.promptsUntilCorrect}
                  </div>

                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="qualityLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke="url(#qualityLine)"
                      strokeWidth="2.6"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={analytics.promptSeries
                        .map((point, index) => {
                          const x = (index / Math.max(analytics.promptSeries.length - 1, 1)) * 100;
                          const y = 100 - ((point.outputScore / scoreMax) * 84 + 8);
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    {analytics.promptSeries.map((point, index) => {
                      const x = (index / Math.max(analytics.promptSeries.length - 1, 1)) * 100;
                      const y = 100 - ((point.outputScore / scoreMax) * 84 + 8);
                      const active = point.prompt === analytics.promptsUntilCorrect;

                      return (
                        <g key={point.prompt}>
                          <circle cx={x} cy={y} r={active ? 2.8 : 2.1} fill={active ? '#2dd4bf' : '#a78bfa'} />
                        </g>
                      );
                    })}
                  </svg>

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-1">
                    {analytics.promptSeries.map((point) => (
                      <div key={point.prompt} className="text-[0.68rem]" style={{ color: '#94a3b8', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                        P{point.prompt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ChartCard>

            <div
              className="overflow-hidden rounded-[22px] border"
              style={{
                background: 'linear-gradient(180deg, rgba(11,17,26,0.92), rgba(16,25,35,0.84))',
                borderColor: 'rgba(31, 43, 58, 0.95)',
                boxShadow: '0 20px 40px rgba(2, 6, 23, 0.22)',
              }}
            >
              <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(49, 67, 85, 0.55)' }}>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Prompt Breakdown</h2>
                <p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>
                  Prompt-by-prompt view of token usage, output quality, and result stage.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr style={{ background: 'rgba(13, 21, 32, 0.8)' }}>
                      {['Prompt #', 'Tokens Used', 'Output Score', 'Status', 'Notes'].map((label) => (
                        <th
                          key={label}
                          className="px-4 py-3 text-left text-[0.68rem] font-medium"
                          style={{
                            color: 'var(--text-subtle)',
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.promptSeries.map((point) => {
                      const status = getPromptStatus(point.prompt, analytics.promptsUntilCorrect);
                      const statusStyle = getStatusStyle(status);

                      return (
                        <tr key={point.prompt} style={{ borderTop: '1px solid rgba(49, 67, 85, 0.42)' }}>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--foreground)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                            P{point.prompt}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#cbd5e1', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                            {formatNumber(point.tokens)}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#cbd5e1' }}>
                            {point.outputScore}/100
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex rounded-full px-2.5 py-1 text-[0.66rem]"
                              style={{
                                background: statusStyle.background,
                                color: statusStyle.color,
                                border: `1px solid ${statusStyle.border}`,
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                              }}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm leading-6" style={{ color: '#94a3b8' }}>
                            {point.notes}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <SidePanel title="Optimization Insights" subtitle="Hardcoded guidance for this demo ticket.">
              <div className="space-y-3">
                {analytics.insights.map((insight) => (
                  <InsightLine key={insight} text={insight} color="#60a5fa" />
                ))}
              </div>
              <div className="mt-4 rounded-[18px] border p-4" style={{ borderColor: 'rgba(45, 212, 191, 0.2)', background: 'rgba(20, 184, 166, 0.08)' }}>
                <div
                  className="mb-2 text-[0.68rem]"
                  style={{
                    color: '#5eead4',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Recommendations
                </div>
                <div className="space-y-2">
                  {analytics.recommendation.map((item) => (
                    <InsightLine key={item} text={item} color="#2dd4bf" />
                  ))}
                </div>
              </div>
            </SidePanel>

            <SidePanel title="Cost Efficiency" subtitle="What this run spent after the correct result was already achieved.">
              <div className="space-y-4">
                <EfficiencyRow label="Cost per correct output" value={formatCompactCurrency(derived.costPerCorrectOutput)} />
                <EfficiencyRow label="Tokens after correct output" value={formatNumber(derived.tokensAfterCorrect)} />
                <EfficiencyRow label="Potential savings" value={formatCompactCurrency(derived.potentialSavings)} />
                <div className="rounded-[18px] border p-4" style={{ background: 'rgba(13, 21, 32, 0.78)', borderColor: 'rgba(31, 43, 58, 0.95)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#dce3ee' }}>Efficiency score</span>
                    <span className="text-lg font-semibold" style={{ color: '#4ade80' }}>
                      {derived.efficiencyScore}/100
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: 'rgba(49, 67, 85, 0.55)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${derived.efficiencyScore}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #14b8a6)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </SidePanel>

            <SidePanel title="Run Snapshot" subtitle="Quick high-signal context for the selected ticket.">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Total Prompts" value={String(analytics.totalPrompts)} />
                <MiniStat label="Peak Prompt" value={formatNumber(analytics.highestTokenPrompt)} />
                <MiniStat label="Lowest Prompt" value={formatNumber(analytics.lowestTokenPrompt)} />
                <MiniStat label="Final Score" value={`${analytics.finalOutputScore}%`} />
              </div>
            </SidePanel>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
  tone: string;
}) {
  return (
    <div
      className="rounded-[20px] border p-4"
      style={{
        background: 'linear-gradient(180deg, rgba(16,25,35,0.96), rgba(11,17,26,0.88))',
        borderColor: 'rgba(31, 43, 58, 0.95)',
        boxShadow: '0 16px 34px rgba(2, 6, 23, 0.22)',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl border"
          style={{ background: accent, color: tone, borderColor: 'rgba(255,255,255,0.04)' }}
        >
          {icon}
        </div>
        <span
          className="text-[0.62rem]"
          style={{
            color: tone,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Live Demo
        </span>
      </div>
      <div className="text-xl font-semibold tracking-tight" style={{ color: 'var(--foreground)' }}>
        {value}
      </div>
      <div className="mt-1 text-[0.72rem]" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-[22px] border p-5"
      style={{
        background: 'linear-gradient(180deg, rgba(11,17,26,0.92), rgba(16,25,35,0.84))',
        borderColor: 'rgba(31, 43, 58, 0.95)',
        boxShadow: '0 20px 40px rgba(2, 6, 23, 0.22)',
      }}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h2>
        <p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function SidePanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-[22px] border p-5"
      style={{
        background: 'linear-gradient(180deg, rgba(11,17,26,0.92), rgba(16,25,35,0.84))',
        borderColor: 'rgba(31, 43, 58, 0.95)',
        boxShadow: '0 20px 40px rgba(2, 6, 23, 0.22)',
      }}
    >
      <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{title}</h2>
      <p className="mt-1 text-xs" style={{ color: '#94a3b8' }}>{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function InsightLine({ text, color }: { text: string; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
      <p className="text-sm leading-6" style={{ color: '#cbd5e1' }}>{text}</p>
    </div>
  );
}

function EfficiencyRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-[16px] border px-4 py-3"
      style={{ background: 'rgba(13, 21, 32, 0.78)', borderColor: 'rgba(31, 43, 58, 0.95)' }}
    >
      <span className="text-sm" style={{ color: '#94a3b8' }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[16px] border p-4"
      style={{ background: 'rgba(13, 21, 32, 0.78)', borderColor: 'rgba(31, 43, 58, 0.95)' }}
    >
      <div
        className="text-[0.62rem]"
        style={{
          color: 'var(--text-subtle)',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
        {value}
      </div>
    </div>
  );
}

function getStatusStyle(status: PromptStatus) {
  switch (status) {
    case 'Exploration':
      return { background: 'rgba(123, 132, 148, 0.14)', color: '#cbd5e1', border: 'rgba(123, 132, 148, 0.22)' };
    case 'Partial':
      return { background: 'rgba(59, 130, 246, 0.14)', color: '#93c5fd', border: 'rgba(59, 130, 246, 0.22)' };
    case 'Improved':
      return { background: 'rgba(139, 92, 246, 0.14)', color: '#c4b5fd', border: 'rgba(139, 92, 246, 0.24)' };
    case 'Correct':
      return { background: 'rgba(20, 184, 166, 0.14)', color: '#5eead4', border: 'rgba(45, 212, 191, 0.22)' };
    case 'Refinement':
      return { background: 'rgba(245, 158, 11, 0.14)', color: '#fcd34d', border: 'rgba(245, 158, 11, 0.22)' };
  }
}
