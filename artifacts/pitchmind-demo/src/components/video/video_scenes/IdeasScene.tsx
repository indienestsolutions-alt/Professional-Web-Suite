import { motion } from 'framer-motion';

const IDEAS = [
  { name: 'EcoDeliver', stage: 'Seed', score: 82, tag: 'CleanTech' },
  { name: 'MedBridge', stage: 'Pre-seed', score: 74, tag: 'HealthTech' },
  { name: 'LearnLoop', stage: 'Idea', score: 91, tag: 'EdTech' },
];

const CHAT_MESSAGES = [
  { role: 'user', text: 'A platform connecting local farms directly to restaurants — cutting out the middleman.', delay: 1.0 },
  { role: 'ai', text: 'Great idea! Let me structure this into a fundable pitch framework...', delay: 2.2 },
];

export default function IdeasScene() {
  return (
    <motion.div
      className="absolute inset-0 flex overflow-hidden"
      style={{ background: '#0D0D0D' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6 }}
    >
      {/* Sidebar */}
      <motion.div
        className="flex flex-col shrink-0 overflow-hidden"
        style={{ width: '220px', background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 14px' }}
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-7 px-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FF5B04' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>P</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#FAF7F2' }}>PitchMind</span>
        </div>

        {[
          { icon: '⚡', label: 'Dashboard', active: false },
          { icon: '💡', label: 'My Ideas', active: true },
          { icon: '🎯', label: 'Train', active: false },
          { icon: '📊', label: 'Reports', active: false },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-1"
            style={{
              background: item.active ? 'rgba(255,91,4,0.12)' : 'transparent',
              borderLeft: item.active ? '2px solid #FF5B04' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.85rem', color: item.active ? '#FF5B04' : '#6B6560', fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '24px 28px' }}>
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-5 shrink-0"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: '#FAF7F2' }}>My Ideas</h2>
            <p style={{ color: '#6B6560', fontSize: '0.82rem', marginTop: '1px' }}>Track and train each startup idea</p>
          </div>
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-xl shrink-0"
            style={{ background: '#FF5B04', cursor: 'pointer' }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ delay: 1.6, duration: 0.4 }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>+ New Idea</span>
          </motion.div>
        </motion.div>

        {/* Idea cards */}
        <div className="flex flex-col gap-2.5 mb-4 shrink-0">
          {IDEAS.map((idea, i) => (
            <motion.div
              key={idea.name}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,91,4,0.15)' }}>
                  <span style={{ fontSize: '1.1rem' }}>💡</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FAF7F2' }}>{idea.name}</p>
                  <p style={{ fontSize: '0.75rem', color: '#6B6560' }}>{idea.stage} · {idea.tag}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p style={{ fontSize: '0.7rem', color: '#6B6560', marginBottom: '1px' }}>Readiness</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: idea.score >= 85 ? '#22C55E' : idea.score >= 70 ? '#FF5B04' : '#F59E0B' }}>
                    {idea.score}%
                  </p>
                </div>
                <div className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,91,4,0.15)', color: '#FF5B04', fontSize: '0.75rem', fontWeight: 600 }}>
                  Train →
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI chat input for new idea */}
        <motion.div
          className="rounded-2xl flex-1 flex flex-col overflow-hidden"
          style={{ background: '#161616', border: '1px solid rgba(255,91,4,0.25)', padding: '14px 18px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <p style={{ fontSize: '0.72rem', color: '#FF5B04', fontWeight: 600, marginBottom: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>
            AI Idea Builder
          </p>
          <div className="flex flex-col gap-2.5 overflow-hidden">
            {CHAT_MESSAGES.map((msg) => (
              <motion.div
                key={msg.text}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: msg.delay, duration: 0.5 }}
              >
                <div
                  className="px-3.5 py-2.5 rounded-2xl"
                  style={{
                    maxWidth: '85%',
                    background: msg.role === 'user' ? '#FF5B04' : 'rgba(255,255,255,0.07)',
                    color: msg.role === 'user' ? '#fff' : '#A8A39B',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                  }}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
