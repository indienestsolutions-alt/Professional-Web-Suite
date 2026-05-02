import { motion } from 'framer-motion';

const FINAL_SCORES = [
  { label: 'Confidence', score: 84, color: '#FF5B04' },
  { label: 'Clarity', score: 89, color: '#7B68EE' },
  { label: 'Traction', score: 76, color: '#22C55E' },
  { label: 'Conviction', score: 91, color: '#F59E0B' },
];

export default function ReadinessScene() {
  const avg = Math.round(FINAL_SCORES.reduce((s, m) => s + m.score, 0) / FINAL_SCORES.length);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0D0D0D' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 0.6 }}
    >
      {/* Background celebration glow */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,91,4,0.14) 0%, transparent 65%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 1.5 }}
      />

      {/* Floating confetti dots */}
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${6 + (i % 4) * 3}px`,
            height: `${6 + (i % 4) * 3}px`,
            left: `${8 + (i * 6.1) % 84}%`,
            top: `${10 + (i * 7.3) % 80}%`,
            background: ['#FF5B04', '#7B68EE', '#22C55E', '#F59E0B'][i % 4],
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 0.5], y: [-20, -60, -100] }}
          transition={{ delay: 1.2 + (i * 0.12), duration: 2.5, ease: 'easeOut' }}
        />
      ))}

      {/* AI declaration */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        style={{ maxWidth: '700px', padding: '0 40px' }}
      >
        {/* Icon */}
        <motion.div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
          style={{ background: 'rgba(255,91,4,0.15)', border: '2px solid rgba(255,91,4,0.4)' }}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span style={{ fontSize: '2.5rem' }}>🏆</span>
        </motion.div>

        {/* AI label */}
        <motion.div
          className="flex items-center gap-2 mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#22C55E', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Marcus Chen · AI Investor Declaration
          </span>
        </motion.div>

        {/* Main quote */}
        <motion.h2
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '3.2rem', color: '#FAF7F2', lineHeight: 1.1, marginBottom: '1.2rem' }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          "I've seen enough.
          <br />
          <span style={{ color: '#FF5B04' }}>You're ready."</span>
        </motion.h2>

        <motion.p
          style={{ color: '#A8A39B', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.7 }}
        >
          Your unit economics were tight, your TAM story was credible, and you held conviction under pressure.
          This is investor-ready material.
        </motion.p>

        {/* Score report card */}
        <motion.div
          className="w-full rounded-2xl overflow-hidden"
          style={{ background: '#161616', border: '1px solid rgba(255,91,4,0.25)' }}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 1.8, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#FAF7F2' }}>Session Report</p>
                <p style={{ color: '#6B6560', fontSize: '0.8rem' }}>FarmConnect · Marcus Chen · 6 turns</p>
              </div>
              <div className="text-center">
                <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '2.2rem', color: '#FF5B04', lineHeight: 1 }}>{avg}</p>
                <p style={{ color: '#6B6560', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Overall</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 divide-x" style={{ borderTop: 'none', borderColor: 'rgba(255,255,255,0.07)' }}>
            {FINAL_SCORES.map((s) => (
              <div key={s.label} className="flex flex-col items-center py-4" style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
                <motion.p
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.5rem', color: s.color }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2, duration: 0.5 }}
                >
                  {s.score}
                </motion.p>
                <p style={{ color: '#6B6560', fontSize: '0.72rem', marginTop: '2px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
