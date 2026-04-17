import { useState, useRef } from 'react';
import { ArrowUp, Plus } from 'lucide-react';
import { ProjectSetupData } from '../types';

const PROXY_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api/project/setup'
  : '/api/project/setup';

interface ProjectSetupWizardProps {
  projectName: string;
  onComplete: (data: ProjectSetupData | null) => void;
}

export function ProjectSetupWizard({ projectName, onComplete }: ProjectSetupWizardProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 65_000);

    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          projectContext: { projectName, existingTasks: 0, existingDevelopers: 0 },
        }),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Unknown error' })) as { error?: string };
        throw new Error(error ?? `Server error ${res.status}`);
      }

      const { projectData } = await res.json() as {
        text: string;
        projectData: ProjectSetupData | null;
      };
      onComplete(projectData);
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      setError(isTimeout
        ? 'Request timed out. The server may be overloaded — please try again.'
        : 'Failed to connect. Make sure the server is running (npm run dev:full).'
      );
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: '#ffffff' }}
    >
      {/* Skip button */}
      <button
        onClick={() => onComplete(null)}
        className="absolute top-5 right-6 text-xs px-3 py-1.5 transition-colors"
        style={{
          color: '#71717a',
          border: '1px solid #e4e4e7',
          borderRadius: '6px',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#3f3f46';
          e.currentTarget.style.background = '#f4f4f5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#71717a';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        Skip setup
      </button>

      {/* Heading */}
      <div className="text-center mb-10 px-4">
        <h1
          className="font-bold tracking-tight mb-3"
          style={{ color: '#0f0f0f', fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.1 }}
        >
          Plan your project
        </h1>
        <p
          className="text-base"
          style={{ color: '#71717a', fontSize: '1.0625rem' }}
        >
          Describe {projectName} and AI will generate tasks and team structure
        </p>
      </div>

      {/* Input box */}
      <div
        className="w-full mx-auto"
        style={{ maxWidth: '720px', padding: '0 20px' }}
      >
        <div
          style={{
            background: '#fafafa',
            border: '1px solid #e4e4e7',
            borderRadius: '16px',
            padding: '18px 18px 14px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          }}
        >
          <textarea
            ref={textareaRef}
            rows={3}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={`Describe what ${projectName} is about…`}
            className="w-full resize-none outline-none leading-relaxed disabled:opacity-40"
            style={{
              background: 'transparent',
              color: '#0f0f0f',
              caretColor: '#0f0f0f',
              minHeight: '72px',
              maxHeight: '160px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9375rem',
            }}
          />

          {error && (
            <p className="text-xs mt-1 mb-2" style={{ color: '#dc2626' }}>{error}</p>
          )}

          {/* Bottom bar */}
          <div className="flex items-center justify-between mt-2">
            <button
              className="w-8 h-8 flex items-center justify-center transition-colors"
              style={{
                color: '#a1a1aa',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#3f3f46';
                e.currentTarget.style.borderColor = '#a1a1aa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#a1a1aa';
                e.currentTarget.style.borderColor = '#e4e4e7';
              }}
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={() => void handleSend()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: '#0f0f0f',
                color: '#ffffff',
                borderRadius: '50%',
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'scale(1.07)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {loading ? (
                <span
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: '#52525b', borderTopColor: '#ffffff' }}
                />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
