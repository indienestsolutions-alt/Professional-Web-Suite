import { motion } from 'framer-motion';

export default function OutroScene() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0D0D0D' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      transition={{ duration: 0.8 }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.25,
        }}
      />

      {/* Strong orange glow center */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 52%, rgba(255,91,4,0.28) 0%, transparent 65%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1.2 }}
      />

      {/* Logo mark */}
      <motion.div
        className="relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
        style={{ background: '#FF5B04' }}
        initial={{ scale: 0, rotate: 15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <span style={{ color: '#fff', fontWeight: 900, fontSize: '2.4rem', fontFamily: 'var(--font-display)' }}>P</span>
      </motion.div>

      {/* Brand name */}
      <motion.h1
        className="relative z-10"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '4.5rem', color: '#FAF7F2', letterSpacing: '-0.03em', lineHeight: 1 }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        PitchMind <span style={{ color: '#FF5B04' }}>AI</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="relative z-10 mt-5"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.5rem', color: '#A8A39B', letterSpacing: '0.02em' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
      >
        Pitch like you've already raised.
      </motion.p>

      {/* Divider */}
      <motion.div
        className="relative z-10 my-10"
        style={{ width: '80px', height: '2px', background: 'rgba(255,91,4,0.4)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      />

      {/* Feature pills */}
      <motion.div
        className="relative z-10 flex gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.7 }}
      >
        {['AI Investor Personas', 'Voice Pitch Sessions', 'Readiness Scoring'].map((feat) => (
          <div
            key={feat}
            className="px-5 py-2.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span style={{ color: '#A8A39B', fontSize: '0.88rem', fontWeight: 500 }}>{feat}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        className="relative z-10 mt-12 px-10 py-4 rounded-2xl"
        style={{ background: '#FF5B04', cursor: 'pointer' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2.0, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '0.01em' }}>
          Start your first pitch session →
        </span>
      </motion.div>
    </motion.div>
  );
}
