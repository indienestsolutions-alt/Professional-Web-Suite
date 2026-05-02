import { motion } from 'framer-motion';

const BREAKDOWN_ITEMS = [
  { label: 'Problem', value: 'Restaurants overpay middlemen; local farms earn 30% less than market rate.', color: '#FF5B04', icon: '🎯' },
  { label: 'Solution', value: 'Direct digital marketplace connecting farms & restaurants with real-time pricing.', color: '#7B68EE', icon: '⚡' },
  { label: 'Market', value: '$300B US food distribution market; $12B addressable in local/regional supply.', color: '#22C55E', icon: '📈' },
  { label: 'Business Model', value: '3% transaction fee on each order + premium analytics for restaurant chains.', color: '#F59E0B', icon: '💰' },
  { label: 'Traction', value: 'Signed LOIs with 8 farms, 3 pilot restaurants in Austin, TX. 2K orders projected.', color: '#EC4899', icon: '🚀' },
];

export default function BreakdownScene() {
  return (
    <motion.div
      className="absolute inset-0 flex overflow-hidden"
      style={{ background: '#0D0D0D' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6 }}
    >
      {/* Left: AI chat interface */}
      <div className="flex flex-col" style={{ width: '38%', padding: '32px 28px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.div
          className="flex items-center gap-2 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,91,4,0.2)', border: '1px solid rgba(255,91,4,0.4)' }}>
            <span style={{ fontSize: '1rem' }}>🤖</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#FAF7F2', fontSize: '1rem' }}>PitchMind AI</span>
          <div className="flex items-center gap-1 ml-auto">
            <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} />
            <span style={{ color: '#22C55E', fontSize: '0.75rem' }}>Analyzing</span>
          </div>
        </motion.div>

        <motion.div
          className="rounded-xl p-4 mb-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <p style={{ color: '#A8A39B', fontSize: '0.88rem', lineHeight: 1.6 }}>
            "A platform that connects local farms directly to restaurants — cutting out the middleman."
          </p>
        </motion.div>

        <motion.div
          className="rounded-xl p-4"
          style={{ background: 'rgba(255,91,4,0.08)', border: '1px solid rgba(255,91,4,0.2)' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <p style={{ color: '#FF5B04', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI Analysis</p>
          <p style={{ color: '#A8A39B', fontSize: '0.88rem', lineHeight: 1.6 }}>
            Strong problem-solution fit. I've identified your core pitch pillars. Structuring your deck now...
          </p>
        </motion.div>

        {/* Deck preview card */}
        <motion.div
          className="mt-auto rounded-xl p-5 flex flex-col gap-3"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.6 }}
        >
          <p style={{ color: '#FAF7F2', fontWeight: 700, fontSize: '0.9rem' }}>📊 Pitch Deck Generated</p>
          <p style={{ color: '#6B6560', fontSize: '0.8rem' }}>8 slides · Investor-ready format</p>
          <div className="flex gap-2">
            {['Problem', 'Solution', 'Market', 'Traction', 'Ask'].map((slide) => (
              <div key={slide} className="px-2 py-1 rounded" style={{ background: 'rgba(123,104,238,0.15)', border: '1px solid rgba(123,104,238,0.25)' }}>
                <span style={{ color: '#7B68EE', fontSize: '0.7rem', fontWeight: 600 }}>{slide}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right: Breakdown cards */}
      <div className="flex-1 flex flex-col" style={{ padding: '32px 36px', gap: '12px' }}>
        <motion.h2
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: '#FAF7F2', marginBottom: '4px' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Pitch Framework
        </motion.h2>
        <motion.p
          style={{ color: '#6B6560', fontSize: '0.85rem', marginBottom: '8px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          AI-structured from your idea in seconds
        </motion.p>

        {BREAKDOWN_ITEMS.map((item, i) => (
          <motion.div
            key={item.label}
            className="rounded-xl p-4 flex gap-4"
            style={{ background: '#161616', border: `1px solid ${item.color}22` }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${item.color}18` }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700, color: item.color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {item.label}
                </span>
                <div className="h-px flex-1" style={{ background: `${item.color}20` }} />
              </div>
              <p style={{ color: '#A8A39B', fontSize: '0.85rem', lineHeight: 1.55 }}>{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
