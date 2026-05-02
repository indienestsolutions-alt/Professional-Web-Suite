import { motion } from 'framer-motion';

const IDEAS = [
  { name: 'EcoDeliver', stage: 'Seed', score: 82, tag: 'CleanTech' },
  { name: 'MedBridge', stage: 'Pre-seed', score: 74, tag: 'HealthTech' },
  { name: 'LearnLoop', stage: 'Idea', score: 91, tag: 'EdTech' },
];

const CHAT_MESSAGES = [
  { role: 'user', text: 'A platform that connects local farms directly to restaurants — cutting out the middleman.', delay: 1.0 },
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
        className="flex flex-col"
        style={{ width: '260px', background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '28px 16px' }}
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FF5B04' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>P</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: '#FAF7F2' }}>PitchMind</span>
        </div>

        {[
          { icon: '⚡', label: 'Dashboard', active: false },
          { icon: '💡', label: 'My Ideas', active: true },
          { icon: '🎯', label: 'Train', active: false },
          { icon: '📊', label: 'Reports', active: false },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1"
            style={{
              background: item.active ? 'rgba(255,91,4,0.12)' : 'transparent',
              borderLeft: item.active ? '2px solid #FF5B04' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
            <span style={{ fontSize: '0.9rem', color: item.active ? '#FF5B04' : '#6B6560', fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Main area */}
      <div className="flex-1 flex flex-col" style={{ padding: '32px 36px' }}>
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: '#FAF7F2' }}>My Ideas</h2>
            <p style={{ color: '#6B6560', fontSize: '0.9rem', marginTop: '2px' }}>Track and train each startup idea</p>
          </div>
          <motion.div
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl"
            style={{ background: '#FF5B04', cursor: 'pointer' }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ delay: 1.6, duration: 0.4 }}
          >
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>+ New Idea</span>
          </motion.div>
        </motion.div>

        {/* Idea cards */}
        <div className="flex flex-col gap-3 mb-6">
          {IDEAS.map((idea, i) => (
            <motion.div
              key={idea.name}
              className="flex items-center justify-between px-5 py-4 rounded-xl"
              style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,91,4,0.15)' }}>
                  <span style={{ fontSize: '1.2rem' }}>💡</span>
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#FAF7F2' }}>{idea.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#6B6560' }}>{idea.stage} · {idea.tag}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p style={{ fontSize: '0.75rem', color: '#6B6560', marginBottom: '2px' }}>Readiness</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: idea.score >= 85 ? '#22C55E' : idea.score >= 70 ? '#FF5B04' : '#F59E0B' }}>
                    {idea.score}%
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,91,4,0.15)', color: '#FF5B04' }}>
                  Train →
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI chat input for new idea */}
        <motion.div
          className="rounded-2xl p-5 flex-1 flex flex-col"
          style={{ background: '#161616', border: '1px solid rgba(255,91,4,0.25)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <p style={{ fontSize: '0.8rem', color: '#FF5B04', fontWeight: 600, marginBottom: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            AI Idea Builder
          </p>
          <div className="flex flex-col gap-3">
            {CHAT_MESSAGES.map((msg) => (
              <motion.div
                key={msg.text}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: msg.delay, duration: 0.5 }}
              >
                <div
                  className="px-4 py-3 rounded-2xl max-w-md"
                  style={{
                    background: msg.role === 'user' ? '#FF5B04' : 'rgba(255,255,255,0.07)',
                    color: msg.role === 'user' ? '#fff' : '#A8A39B',
                    fontSize: '0.9rem',
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
