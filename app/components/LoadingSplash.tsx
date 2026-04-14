import { motion } from 'motion/react';

export function LoadingSplash() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: '#08111f',
        pointerEvents: 'none',
      }}
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <div className="flex flex-col leading-none mb-6">
            <span className="text-[0.7rem] uppercase tracking-[0.3em] text-slate-400 font-medium">
              CONTROL DECK
            </span>
            <h1 
              className="text-5xl tracking-[0.2em] text-slate-100 mt-2"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              SYMPHONY
            </h1>
          </div>

          {/* Loading dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-cyan-500"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
