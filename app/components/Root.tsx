import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DetailPanel } from './DetailPanel';
import { LoadingSplash } from './LoadingSplash';
import { AppProvider, useApp } from '../context/AppContext';
import { ClaudeSessionProvider } from '../context/ClaudeSessionContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ClaudeStatusBar } from './ClaudeStatusBar';

function RootContent() {
  const { panelStack, closePanel, loading: dataLoading } = useApp();
  const [timerDone, setTimerDone] = useState(false);

  useKeyboardShortcuts(() => {
    if (panelStack.length > 0) closePanel();
  });

  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const showSplash = !timerDone || dataLoading;

  return (
    <>
      {showSplash && <LoadingSplash />}

      <div className="h-screen w-screen overflow-hidden relative" style={{ background: '#ffffff' }}>
        <div className="relative h-full flex flex-col">
          <Header />

          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <Outlet context={{}} />
            </main>
          </div>
          <ClaudeStatusBar />
        </div>

        {panelStack.length > 0 && <DetailPanel />}
      </div>
    </>
  );
}

export function Root() {
  return (
    <ClaudeSessionProvider>
      <AppProvider>
        <RootContent />
      </AppProvider>
    </ClaudeSessionProvider>
  );
}