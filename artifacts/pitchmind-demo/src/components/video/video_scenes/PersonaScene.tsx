import { motion } from 'framer-motion';

const PERSONAS = [
  {
    name: 'Marcus Chen',
    role: 'Partner, Sequoia Capital',
    style: 'Aggressive · Data-driven',
    focus: ['Revenue metrics', 'Defensibility', 'Why now?'],
    color: '#FF5B04',
    emoji: '🦾',
    description: 'Will push hard on unit economics. Expects precise answers.',
  },
  {
    name: 'Sarah Mitchell',
    role: 'Angel Investor · YC Alum',
    style: 'Supportive · Founder-first',
    focus: ['Team story', 'Vision', 'Market timing'],
    color: '#7B68EE',
    emoji: '🌟',
    description: 'Warm but thorough. Believes in founders first, market second.',
  },
  {
    name: 'David Park',
    role: 'VC Analyst, a16z',
    style: 'Analytical · Research-heavy',
    focus: ['TAM/SAM/SOM', 'Competitive moat', 'GTM strategy'],
    color: '#22C55E',
    emoji: '🔬',
    description: 'Comes prepared with industry research. Loves market maps.',
  },
];

export default function PersonaScene() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#0D0D0D', padding: '20px 40px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6 }}
    >
      {/* Background glow spots */}
      <div className="absolute inset-0 pointer-events-none">
        {PERSONAS.map((p, i) => (
          <motion.div
            key={p.name}
            className="absolute rounded-full"
            style={{
              width: '280px',
              height: '280px',
              left: `${17 + i * 28}%`,
              top: '55%',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${p.color}10 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.2, duration: 1 }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-5 z-10 shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5B04' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#FF5B04', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Choose Your Investor
          </span>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF5B04' }} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: '#FAF7F2', lineHeight: 1.1 }}>
          The Arena Is Warm.{' '}
          <span style={{ color: '#FF5B04' }}>Pick Your Challenger.</span>
        </h2>
      </motion.div>

      {/* Persona cards */}
      <div className="flex gap-5 z-10 w-full" style={{ maxWidth: '960px' }}>
        {PERSONAS.map((persona, i) => (
          <motion.div
            key={persona.name}
            className="flex flex-col rounded-2xl overflow-hidden flex-1"
            style={{
              background: '#161616',
              border: `1px solid ${persona.color}30`,
            }}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.18, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Card top accent */}
            <div style={{ height: '3px', background: persona.color, flexShrink: 0 }} />

            <div className="flex flex-col" style={{ padding: '16px 18px' }}>
              {/* Avatar */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 shrink-0" style={{ background: `${persona.color}18`, border: `1px solid ${persona.color}30` }}>
                <span style={{ fontSize: '1.5rem' }}>{persona.emoji}</span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: '#FAF7F2', marginBottom: '1px' }}>{persona.name}</h3>
              <p style={{ color: persona.color, fontSize: '0.72rem', fontWeight: 600, marginBottom: '6px' }}>{persona.role}</p>
              <p style={{ color: '#6B6560', fontSize: '0.78rem', marginBottom: '10px', lineHeight: 1.45 }}>{persona.description}</p>

              {/* Style tag */}
              <div className="mb-3">
                <span
                  className="px-2.5 py-0.5 rounded-full"
                  style={{ fontSize: '0.68rem', fontWeight: 700, background: `${persona.color}18`, color: persona.color, border: `1px solid ${persona.color}30` }}
                >
                  {persona.style}
                </span>
              </div>

              {/* Focus areas */}
              <div className="flex flex-col gap-1 mb-3">
                <p style={{ color: '#6B6560', fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>Will ask about</p>
                {persona.focus.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ background: persona.color }} />
                    <span style={{ color: '#A8A39B', fontSize: '0.78rem' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Select button */}
            <motion.div
              className="mx-3 mb-3 py-2 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: i === 0 ? persona.color : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}
              animate={i === 0 ? { scale: [1, 1.03, 1] } : {}}
              transition={{ delay: 2.2, duration: 0.4, repeat: 1 }}
            >
              <span style={{ color: i === 0 ? '#fff' : '#6B6560', fontWeight: 700, fontSize: '0.82rem' }}>
                {i === 0 ? 'Selected ✓' : 'Select'}
              </span>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
