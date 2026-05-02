import { motion } from 'framer-motion';

export default function HeroScene() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0D0D0D' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 0.8 }}
    >
      {/* Hero background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.45,
        }}
      />

      {/* Orange radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(255,91,4,0.22) 0%, transparent 70%)',
        }}
      />

      {/* Top line */}
      <motion.div
        className="relative z-10 flex items-center gap-3 mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
      >
        <div className="w-2 h-2 rounded-full bg-orange-500" />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#FF5B04', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          PitchMind AI
        </span>
        <div className="w-2 h-2 rounded-full bg-orange-500" />
      </motion.div>

      {/* Main headline */}
      <div className="relative z-10 text-center px-12">
        <motion.h1
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '5.5rem', lineHeight: 1.05, color: '#FAF7F2', letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          Pitch like you've
          <br />
          <span style={{ color: '#FF5B04' }}>already raised.</span>
        </motion.h1>

        <motion.p
          style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '1.45rem', color: '#A8A39B', marginTop: '1.5rem', letterSpacing: '0.01em' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
        >
          AI-powered pitch coaching for student founders.
        </motion.p>
      </div>

      {/* Bottom badge */}
      <motion.div
        className="relative z-10 mt-14"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.7, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          className="flex items-center gap-3 px-6 py-3 rounded-full border"
          style={{ borderColor: 'rgba(255,91,4,0.35)', background: 'rgba(255,91,4,0.08)' }}
        >
          <span style={{ fontSize: '0.95rem', color: '#FF5B04', fontWeight: 600 }}>Live pitch training</span>
          <span style={{ color: '#6B6560' }}>·</span>
          <span style={{ fontSize: '0.95rem', color: '#A8A39B', fontWeight: 500 }}>AI feedback</span>
          <span style={{ color: '#6B6560' }}>·</span>
          <span style={{ fontSize: '0.95rem', color: '#A8A39B', fontWeight: 500 }}>Investor readiness</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
