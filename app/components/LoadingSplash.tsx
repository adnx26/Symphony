import { motion } from 'motion/react';

export function LoadingSplash() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.4, delay: 0.9 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: '#ffffff',
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-[0.65rem] uppercase tracking-[0.25em] font-medium"
            style={{ color: '#a1a1aa' }}
          >
            Control Deck
          </span>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ color: '#0f0f0f', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          >
            Symphony
          </h1>
        </div>

        {/* Loading indicator — thin progress line, Lovable-style */}
        <div
          className="relative overflow-hidden"
          style={{ width: 120, height: 2, background: '#e4e4e7', borderRadius: 1 }}
        >
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#0f0f0f',
              borderRadius: 1,
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
