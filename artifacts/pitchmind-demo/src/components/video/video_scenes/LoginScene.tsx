import { motion } from 'framer-motion';

export default function LoginScene() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-between overflow-hidden"
      style={{ background: '#0D0D0D', padding: '0 6% 0 8%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6 }}
    >
      {/* Gradient mesh background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/gradient-mesh.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
        }}
      />

      {/* Left info panel */}
      <motion.div
        className="relative z-10 flex flex-col justify-center"
        style={{ maxWidth: '420px' }}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FF5B04' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>P</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: '#FAF7F2' }}>PitchMind</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.6rem', color: '#FAF7F2', lineHeight: 1.1, marginBottom: '0.8rem' }}>
          Your AI pitch<br />coach awaits.
        </h2>
        <p style={{ color: '#A8A39B', fontSize: '1rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Practice with real investor personas. Get scored on confidence, clarity, and traction.
        </p>

        {/* Feature list */}
        <div className="flex flex-col gap-2.5">
          {['Voice & text pitch sessions', 'AI feedback after every turn', 'Investor readiness declaration'].map((feat, i) => (
            <motion.div
              key={feat}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.12, duration: 0.5 }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,91,4,0.2)', border: '1px solid rgba(255,91,4,0.4)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#FF5B04' }} />
              </div>
              <span style={{ color: '#A8A39B', fontSize: '0.9rem' }}>{feat}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Login card */}
      <motion.div
        className="relative z-10 flex flex-col shrink-0"
        style={{ width: '380px' }}
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="rounded-2xl flex flex-col items-center"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)', padding: '40px 36px' }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#FF5B04' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.4rem' }}>P</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', color: '#FAF7F2', marginBottom: '0.4rem' }}>Welcome back</h3>
          <p style={{ color: '#6B6560', fontSize: '0.85rem', marginBottom: '1.8rem', textAlign: 'center' }}>
            Sign in to continue your pitch training
          </p>

          {/* Sign in button */}
          <motion.div
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl"
            style={{ background: '#FAF7F2', cursor: 'pointer' }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ delay: 2, duration: 0.5, repeat: 1 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#0D0D0D" />
              <text x="12" y="16" textAnchor="middle" fill="#FF5B04" fontSize="12" fontWeight="bold">R</text>
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: '#0D0D0D' }}>
              Continue with Replit
            </span>
          </motion.div>

          <p style={{ color: '#6B6560', fontSize: '0.75rem', marginTop: '1.2rem', textAlign: 'center' }}>
            Secure auth · No password needed
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
