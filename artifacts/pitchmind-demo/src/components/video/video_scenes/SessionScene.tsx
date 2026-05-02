import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useState } from 'react';

const TRANSCRIPT = [
  { role: 'investor', name: 'Marcus Chen', text: "Tell me: why will this destroy incumbents instead of just serving a niche? What's your real moat?", delay: 0.5 },
  { role: 'founder', name: 'You', text: "Our moat is the relationship layer — we embed directly into restaurant POS systems. Switching cost is real. No incumbent does this.", delay: 2.5 },
  { role: 'investor', name: 'Marcus Chen', text: "POS integrations take months and budget. How do you fund that pre-revenue? Walk me through unit economics.", delay: 4.5 },
  { role: 'founder', name: 'You', text: "We close a $250K pre-seed to fund 6-month pilots. CAC is $800, LTV is $9,200 over 2 years. Payback in 30 days on first order.", delay: 6.5 },
];

const SCORE_METRICS = [
  { label: 'Confidence', target: 78, color: '#FF5B04' },
  { label: 'Clarity', target: 84, color: '#7B68EE' },
  { label: 'Traction', target: 71, color: '#22C55E' },
  { label: 'Conviction', target: 88, color: '#F59E0B' },
];

function AnimatedScore({ target, color, delay }: { target: number; color: string; delay: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const step = target / 40;
      const interval = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(interval); }
        else setVal(Math.round(start));
      }, 35);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem', color }}>{val}</span>;
}

export default function SessionScene() {
  return (
    <motion.div
      className="absolute inset-0 flex overflow-hidden"
      style={{ background: '#0D0D0D' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6 }}
    >
      {/* Left: live session */}
      <div className="flex flex-col" style={{ width: '62%', padding: '24px 28px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Session header */}
        <motion.div
          className="flex items-center justify-between mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#EF4444', letterSpacing: '0.15em' }}>LIVE SESSION</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#FAF7F2' }}>Marcus Chen · Turn 3 of ∞</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span style={{ color: '#EF4444', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>02:47</span>
            </div>
          </div>
        </motion.div>

        {/* Transcript */}
        <div className="flex flex-col gap-3 flex-1 overflow-hidden" style={{ marginBottom: '16px' }}>
          {TRANSCRIPT.map((msg, i) => (
            <motion.div
              key={i}
              className={`flex gap-3 ${msg.role === 'founder' ? 'flex-row-reverse' : ''}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: msg.delay, duration: 0.5 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm"
                style={{ background: msg.role === 'investor' ? 'rgba(255,91,4,0.2)' : 'rgba(123,104,238,0.2)' }}
              >
                {msg.role === 'investor' ? '🦾' : '👤'}
              </div>
              <div style={{ maxWidth: '75%' }}>
                <p style={{ fontSize: '0.72rem', color: '#6B6560', marginBottom: '3px', textAlign: msg.role === 'founder' ? 'right' : 'left' }}>
                  {msg.name}
                </p>
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    background: msg.role === 'investor' ? 'rgba(255,255,255,0.06)' : 'rgba(123,104,238,0.15)',
                    border: msg.role === 'investor' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(123,104,238,0.3)',
                    color: '#A8A39B',
                    fontSize: '0.88rem',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mic / input dock */}
        <motion.div
          className="flex items-center gap-4 px-4 py-4 rounded-2xl"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Mic button pulsing */}
          <motion.div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: '#FF5B04', position: 'relative' }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: '#FF5B04' }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
            />
            <span style={{ fontSize: '1.3rem', zIndex: 1 }}>🎙</span>
          </motion.div>

          <div className="flex-1 flex items-center gap-1" style={{ height: '28px' }}>
            {Array.from({ length: 28 }).map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{ width: '3px', background: '#FF5B04', transformOrigin: 'center' }}
                animate={{ scaleY: [0.15, Math.random() * 0.7 + 0.3, 0.15] }}
                transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, delay: Math.random() * 0.5 + 8 }}
              />
            ))}
          </div>

          <span style={{ color: '#6B6560', fontSize: '0.82rem' }}>Listening...</span>
        </motion.div>
      </div>

      {/* Right: live scores */}
      <div className="flex flex-col" style={{ width: '38%', padding: '24px 24px' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#FF5B04', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Live Score Feed
          </p>
        </motion.div>

        <div className="flex flex-col gap-4">
          {SCORE_METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              className="rounded-xl p-4"
              style={{ background: '#161616', border: `1px solid ${metric.color}20` }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: '#A8A39B', fontSize: '0.85rem' }}>{metric.label}</span>
                <AnimatedScore target={metric.target} color={metric.color} delay={1.5 + i * 0.3} />
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(255,255,255,0.07)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: metric.color }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${metric.target}%` }}
                  transition={{ delay: 1.5 + i * 0.3, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Turn feedback */}
        <motion.div
          className="mt-4 rounded-xl p-4"
          style={{ background: 'rgba(255,91,4,0.08)', border: '1px solid rgba(255,91,4,0.2)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.0, duration: 0.6 }}
        >
          <p style={{ color: '#FF5B04', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>💡 AI Coach Tip</p>
          <p style={{ color: '#A8A39B', fontSize: '0.82rem', lineHeight: 1.5 }}>
            Strong unit economics answer. Next: anchor your CAC assumption with a real acquisition channel.
          </p>
        </motion.div>

        {/* Turn counter */}
        <motion.div
          className="mt-auto flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <span style={{ color: '#6B6560', fontSize: '0.82rem' }}>Session turns</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FAF7F2', fontSize: '1rem' }}>3 / —</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
