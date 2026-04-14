import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DetailPanel } from './DetailPanel';
import { LoadingSplash } from './LoadingSplash';
import { AppProvider, useApp } from '../context/AppContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

function RootContent() {
  const { panelStack, closePanel } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  // Keyboard shortcuts
  useKeyboardShortcuts(() => {
    if (panelStack.length > 0) {
      closePanel();
    }
  });

  // Hide loading splash after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading && <LoadingSplash />}

      <div className="h-screen w-screen overflow-hidden relative">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-[#08111f]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_transparent_50%)] opacity-20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#2d1b4e_0%,_transparent_50%)] opacity-15" />

          {/* CSS grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(148, 163, 184, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148, 163, 184, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* Main content */}
        <div className="relative h-full flex flex-col">
          <Header />

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