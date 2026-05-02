import { motion } from 'framer-motion';

export default function LoginScene() {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: '#0D0D0D' }}
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
          opacity: 0.12,
        }}
      />

      {/* Left info panel */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 flex flex-col justify-center px-20"
        style={{ width: '45%' }}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#FF5B04' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>P</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: '#FAF7F2' }}>PitchMind</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '3rem', color: '#FAF7F2', lineHeight: 1.1, marginBottom: '1rem' }}>
          Your AI pitch<br />coach awaits.
        </h2>
        <p style={{ color: '#A8A39B', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '380px' }}>
          Practice with real investor personas. Get scored on confidence, clarity, and traction. Know when you're ready.
        </p>

        {/* Feature list */}
        <div className="flex flex-col gap-3 mt-8">
          {['Voice & text pitch sessions', 'AI feedback after every turn', 'Investor readiness declaration'].map((feat, i) => (
            <motion.div
              key={feat}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,91,4,0.2)', border: '1px solid rgba(255,91,4,0.4)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#FF5B04' }} />
              </div>
              <span style={{ color: '#A8A39B', fontSize: '0.95rem' }}>{feat}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Login card */}
      <motion.div
        className="relative z-10 flex flex-col"
        style={{ width: '420px', marginLeft: 'auto', marginRight: '10%' }}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="rounded-2xl p-10 flex flex-col items-center"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: '#FF5B04' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.6rem' }}>P</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.6rem', color: '#FAF7F2', marginBottom: '0.5rem' }}>Welcome back</h3>
          <p style={{ color: '#6B6560', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'center' }}>
            Sign in to continue your pitch training
          </p>

          {/* Sign in button */}
          <motion.div
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl"
            style={{ background: '#FAF7F2', cursor: 'pointer' }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ delay: 2, duration: 0.5, repeat: 1 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="#0D0D0D" />
              <text x="12" y="16" textAnchor="middle" fill="#FF5B04" fontSize="12" fontWeight="bold">R</text>
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: '#0D0D0D' }}>
              Continue with Replit
            </span>
          </motion.div>

          <p style={{ color: '#6B6560', fontSize: '0.78rem', marginTop: '1.5rem', textAlign: 'center' }}>
            Secure auth via Replit · No password needed
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
