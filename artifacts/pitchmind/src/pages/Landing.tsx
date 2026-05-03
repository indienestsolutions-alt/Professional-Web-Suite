import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Logo";
import {
  ArrowRight,
  Lightbulb,
  Presentation,
  Mic,
  Users,
  Check,
  Quote,
  Zap,
  Target,
  ChevronRight,
} from "lucide-react";

const TICKER_QUESTIONS = [
  "Marcus: Why won't a well-funded VC crush you in 6 months?",
  "Daniel: What's the one assumption, if wrong, that breaks your entire thesis?",
  "Priya: Why YOU? What makes you the right person to solve this?",
  "Marcus: Walk me through your revenue at 18 months. Show the math.",
  "Daniel: Why hasn't this been built already if the gap is so obvious?",
  "Priya: Tell me about a real user conversation. What did they actually say?",
  "Marcus: You have 60 seconds. Convince me this isn't a waste of my money.",
  "Daniel: What if Google launches this next quarter? What do you do?",
  "Priya: If this fails in 2 years, what went wrong?",
  "Marcus: Your biggest competitor just raised $10M. Your move?",
];

export default function LandingPage() {
  const { isAuthenticated, login } = useAuth();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goCTA = () => {
    if (isAuthenticated) setLocation("/dashboard");
    else login();
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all ${
          scrolled
            ? "bg-background/90 backdrop-blur border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Wordmark />
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#personas" className="text-muted-foreground hover:text-foreground transition-colors">Personas</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button size="sm" onClick={() => setLocation("/dashboard")}>Open dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => login()} data-testid="header-login">Log in</Button>
                <Button size="sm" onClick={() => login()}>Get started free</Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 pm-grid-bg opacity-60 pointer-events-none" />
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] pm-aurora pointer-events-none opacity-60" />
        <motion.div style={{ y: heroY }} className="relative max-w-5xl mx-auto px-4 md:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-mono uppercase tracking-[0.16em] text-primary"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Investors don't fund ideas. They fund people.
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.06 }}
            className="mt-6 text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-[1.02]"
          >
            Stop practicing{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">in the mirror.</span>
              <span className="absolute inset-x-0 bottom-1 md:bottom-2 h-3 md:h-4 bg-primary/20 -z-0 -skew-y-1" />
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.14 }}
            className="mt-6 text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto pm-text-balance leading-relaxed"
          >
            PitchMind puts you in the room with AI investors who ask the questions you fear — and coaches you through every answer until you're ready for the real thing.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-10 flex flex-wrap gap-3 justify-center"
          >
            <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/25" onClick={goCTA}>
              Start training free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-7 text-base"
              onClick={() => document.querySelector("#how")?.scrollIntoView({ behavior: "smooth" })}
            >
              See how it works
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["from-primary to-accent","from-accent to-primary","from-yellow-400 to-primary","from-primary to-pink-400"].map((g, i) => (
                  <div key={i} className={`h-7 w-7 rounded-full bg-gradient-to-br ${g} ring-2 ring-background`} />
                ))}
              </div>
              <span>Trusted by founders in 14+ countries</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>Free forever. No credit card.</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* SCROLLING TICKER */}
      <div className="border-y border-border bg-secondary overflow-hidden py-3 relative">
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-secondary to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-secondary to-transparent z-10 pointer-events-none" />
        <motion.div
          className="flex gap-8 whitespace-nowrap text-sm text-secondary-foreground/70 font-mono"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          {[...TICKER_QUESTIONS, ...TICKER_QUESTIONS].map((q, i) => (
            <span key={i} className="inline-flex items-center gap-3 shrink-0">
              <span className="text-primary">→</span>
              <span>{q}</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* STAT STRIP */}
      <section className="py-14 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { stat: "3 min", label: "from raw idea to structured pitch" },
            { stat: "9 slides", label: "auto-generated in investor-preferred order" },
            { stat: "3", label: "AI investors trained to find your weak spots" },
            { stat: "100", label: "investor readiness score, measured every turn" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="font-display text-4xl md:text-5xl font-semibold text-primary">{s.stat}</div>
              <div className="text-sm text-muted-foreground mt-1 max-w-[160px]">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TRUTH BANNER */}
      <section className="py-16 md:py-20 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-semibold tracking-tight pm-text-balance leading-[1.2]"
          >
            "A mediocre idea with a great founder gets funded.
            <br />
            <span className="text-primary">A great idea with a weak founder gets rejected."</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-background/60 text-base max-w-xl mx-auto"
          >
            PitchMind trains both — the idea AND the founder behind it.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Button
              size="lg"
              className="h-12 px-8 text-base gap-2"
              onClick={goCTA}
            >
              Start training free <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <SectionTitle
            eyebrow="01 — The loop"
            title="From a half-baked idea to a pitch you'd bet money on."
            description="Four steps. The same loop the best founders run — compressed into an afternoon."
          />
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", icon: Lightbulb, title: "Dump the idea", body: "Type the rough version. Not pretty. Not edited. Just real. Three sentences is enough to start." },
              { num: "02", icon: Target, title: "AI structures it", body: "Problem, solution, market, model, moat, audience — extracted and sharpened in seconds." },
              { num: "03", icon: Presentation, title: "Deck auto-builds", body: "Nine slides in the exact order investors want to hear them. Every bullet is specific to your idea." },
              { num: "04", icon: Mic, title: "Get in the arena", body: "Live training. You answer; the investor pushes back. Every turn scored. Every weakness exposed." },
            ].map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs text-primary tracking-widest">STEP {s.num}</div>
                  <s.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 md:py-32 bg-card">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <SectionTitle
            eyebrow="02 — Capabilities"
            title="Every tool a first-time founder actually needs."
            description="Not a slide deck app. Not a chat bot. A complete system to go from idea to investor-ready."
          />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard icon={Lightbulb} title="Idea structuring" body="Drop the raw thought. Watch it become a defensible 6-section canvas in seconds — problem, solution, market, model, moat, audience." tone="primary" />
            <FeatureCard icon={Presentation} title="Auto pitch deck" body="Nine slides, in the order investors actually read them, with bullets you can say out loud without sounding like a brochure." tone="accent" />
            <FeatureCard icon={Mic} title="AI pitch arena" body="You speak. The investor pushes back immediately. No pauses. No mercy. Your confidence and clarity scored on every single turn." tone="primary" />
            <FeatureCard icon={Users} title="3 investor personas" body="Marcus (The Shark), Priya (The Believer), Daniel (The Devil's Advocate). Three styles. Three levels of pressure." tone="accent" />
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section id="personas" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <SectionTitle
            eyebrow="03 — The arena"
            title="Three investors. Each one trained to find the gap in your pitch."
            description="They don't accept vague answers. Neither should you."
          />
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Marcus",
                role: "The Shark",
                tag: "Aggressive VC",
                intensity: "Hard",
                description: "ROI-obsessed. Impatient. Cuts to numbers in seconds.",
                line: "Walk me through your revenue at 18 months. Show the math.",
                color: "primary",
                questions: ["Why would I pick you over someone with more traction?", "What's your exit — who buys you?"],
              },
              {
                name: "Priya",
                role: "The Believer",
                tag: "Angel Investor",
                intensity: "Medium",
                description: "Invests in people first. Tests conviction, character, obsession.",
                line: "Why are YOU building this? Not why the market needs it — why you, specifically?",
                color: "accent",
                questions: ["Tell me about a real user conversation.", "Would you work on this for 10 years?"],
              },
              {
                name: "Daniel",
                role: "The Devil's Advocate",
                tag: "Skeptical Judge",
                intensity: "Hard",
                description: "Fair, precise, impossible to impress without real evidence.",
                line: "Why hasn't anyone built this already if the gap is so obvious?",
                color: "primary",
                questions: ["What if Google builds this next quarter?", "What's the one assumption that kills the plan?"],
              },
            ].map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-2xl border border-border bg-card overflow-hidden group hover:border-primary/30 transition-colors"
              >
                <div className={`h-28 ${p.color === "primary" ? "bg-gradient-to-br from-primary/25 to-primary/5" : "bg-gradient-to-br from-accent/25 to-accent/5"} pm-noise`} />
                <div className="p-6 -mt-10">
                  <div className="h-18 w-18 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center font-display text-3xl font-semibold ring-4 ring-card w-16 h-16">
                    {p.name[0]}
                  </div>
                  <div className="mt-4">
                    <div className="font-display text-xl font-semibold">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.role} · {p.tag}</div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Intensity: {p.intensity}
                  </div>
                  <blockquote className="mt-4 text-sm text-foreground border-l-2 border-primary pl-3 leading-relaxed">
                    <Quote className="h-3.5 w-3.5 text-primary mb-1.5" />
                    {p.line}
                  </blockquote>
                  <div className="mt-4 space-y-1.5">
                    {p.questions.map((q) => (
                      <div key={q} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <ChevronRight className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="py-24 md:py-28 bg-card">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <SectionTitle
            eyebrow="04 — The transformation"
            title="What founders look like before and after."
          />
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-background p-8">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">Before PitchMind</div>
              <div className="space-y-4">
                {[
                  "Practiced in the mirror, still froze when pushed back",
                  "Said 'our market is everyone' and didn't know why it hurt",
                  "Pitch deck built on gut feel, not investor logic",
                  "Got asked 'why you?' and had no real answer",
                  "Waited for feedback from mentors who were too polite",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 h-5 w-5 rounded-full border border-muted-foreground/30 flex items-center justify-center text-[10px] shrink-0">✗</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-primary bg-background p-8">
              <div className="font-mono text-xs uppercase tracking-widest text-primary mb-6">After PitchMind</div>
              <div className="space-y-4">
                {[
                  "Knows exactly what investors will ask — because they've been asked",
                  "Has a specific, defensible answer for every weak point",
                  "9-slide deck built in the structure investors actually expect",
                  "Can explain why them, why now, and why this wins",
                  "Gets real feedback that doesn't pull punches",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 md:py-32 bg-secondary text-secondary-foreground">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <SectionTitle eyebrow="05 — Voices" title="Founders who used to freeze on stage." inverted />
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            {[
              { quote: "I went into my first demo day knowing the answer to every question. PitchMind had already asked them all.", name: "Aisha O.", title: "2nd-year CS, NYU" },
              { quote: "The mistake report after every session is brutal in the best way. I stopped saying 'kind of' on day three.", name: "Liam C.", title: "Founder, Loop" },
              { quote: "I've never had a tutor for pitching. This is the closest thing — and it's available at 2am the night before.", name: "Sana M.", title: "High school robotics captain" },
              { quote: "The deck generator gave me a structure I'd been faking for months. Real founders pitch in this order for a reason.", name: "Diego R.", title: "Pre-seed, Mexico City" },
            ].map((t, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-secondary-foreground/10 bg-secondary-foreground/[0.04] p-6 hover:bg-secondary-foreground/[0.07] transition-colors"
              >
                <Quote className="h-5 w-5 text-primary mb-3" />
                <blockquote className="text-base md:text-lg pm-text-balance leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-4 text-sm text-secondary-foreground/60">{t.name} — {t.title}</figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <SectionTitle
              eyebrow="06 — Built for you"
              title="If you haven't pitched out loud yet, you need this most."
              description="PitchMind is for the people who don't have a warm intro to a partner at a16z."
            />
            <ul className="mt-8 space-y-3">
              {[
                "School and college students with their first real idea",
                "Pre-seed founders who freeze when investors push back",
                "Innovation club members heading into a competition",
                "Anyone who's tired of practicing in the mirror alone",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" className="mt-8 h-12 px-7 gap-2" onClick={goCTA}>
              Get started — it's free <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute -inset-6 pm-aurora opacity-40 pointer-events-none" />
            <div className="relative rounded-2xl border border-border bg-card p-7">
              <div className="font-mono text-xs text-primary tracking-widest mb-4">LIVE SESSION — REAL FEEDBACK</div>
              <div className="space-y-3 text-sm">
                <Bubble who="Marcus, Aggressive VC" tone="investor">
                  Why won't a well-funded incumbent crush you in six months?
                </Bubble>
                <Bubble who="You" tone="user">
                  We own a workflow incumbents have ignored because the segment is too small for them. By the time it's worth their attention, we'll have the data moat.
                </Bubble>
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs leading-relaxed space-y-1.5">
                  <div className="font-semibold text-primary">PitchMind Coach</div>
                  <p className="text-foreground">Good instinct — "data moat" is specific and real. But you didn't name the segment, so investors can't picture the market.</p>
                  <p className="text-muted-foreground italic">"SMB supply chain managers — a $3B niche the giants actively ignore. By the time they want it, we'll have the lock-in."</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 md:py-32 bg-card">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <SectionTitle
            eyebrow="07 — Pricing"
            title="Free to start. Always."
            description="Everything you need to build your first investor-ready pitch — for free."
          />
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border p-8 bg-background">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Founder</div>
              <div className="mt-3 font-display text-5xl font-semibold">Free</div>
              <p className="mt-2 text-muted-foreground text-sm">Everything to ship your first real pitch.</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {[
                  "Unlimited ideas, structuring, and decks",
                  "All three investor personas (Marcus, Priya, Daniel)",
                  "Live mistake analysis after every session",
                  "Investor readiness score per turn",
                  "Founder learning library",
                ].map((f) => (
                  <li key={f} className="flex gap-2.5 items-start">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" size="lg" onClick={goCTA}>Start free — no card needed</Button>
            </div>
            <div className="relative rounded-2xl border-2 border-primary p-8 bg-background">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest">Coming soon</div>
              <div className="font-mono text-xs uppercase tracking-widest text-primary">Operator</div>
              <div className="mt-3 font-display text-5xl font-semibold">$9<span className="text-base text-muted-foreground font-sans">/mo</span></div>
              <p className="mt-2 text-muted-foreground text-sm">For founders running pitches every week.</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {[
                  "Custom investor personas you design",
                  "Voice-mode pitch sessions (beta)",
                  "Cohort and team progress dashboards",
                  "Priority deck export and share links",
                ].map((f) => (
                  <li key={f} className="flex gap-2.5 items-start">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8 w-full" size="lg" onClick={goCTA}>Join the waitlist</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="relative rounded-3xl bg-foreground text-background p-10 md:p-16 overflow-hidden text-center">
            <div className="absolute inset-0 pm-grid-bg opacity-10 pointer-events-none" />
            <motion.div
              aria-hidden
              className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/50 blur-3xl pointer-events-none"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <div className="relative">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4">Stop waiting. Start training.</div>
              <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight pm-text-balance leading-[1.05]">
                Your first pitch is the hardest.
                <br />
                <span className="text-primary">Make it the last one you wing.</span>
              </h2>
              <p className="mt-5 text-background/60 text-lg max-w-xl mx-auto">
                Free to start. Three minutes from sign-up to your first structured pitch. No credit card. No fluff.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <Button size="lg" className="h-12 px-8 text-base gap-2" onClick={goCTA}>
                  Start training free <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-4 text-sm text-background/40">Trusted by founders from 14+ countries. Always free to start.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Wordmark />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} PitchMind. Built for the next generation of founders.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ eyebrow, title, description, inverted }: { eyebrow?: string; title: string; description?: string; inverted?: boolean }) {
  return (
    <div className="max-w-3xl">
      {eyebrow && <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</div>}
      <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold tracking-tight pm-text-balance leading-[1.05]">{title}</h2>
      {description && (
        <p className={`mt-4 text-lg ${inverted ? "text-secondary-foreground/70" : "text-muted-foreground"} pm-text-balance`}>{description}</p>
      )}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, body, tone }: { icon: typeof Lightbulb; title: string; body: string; tone: "primary" | "accent" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="group rounded-xl border border-border bg-background p-6 hover:border-primary/30 transition-colors"
    >
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${tone === "primary" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </motion.div>
  );
}

function Bubble({ who, tone, children }: { who: string; tone: "investor" | "user"; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg p-3 ${tone === "investor" ? "bg-secondary/40 border border-border" : "bg-foreground text-background"}`}>
      <div className={`text-[10px] uppercase tracking-widest font-mono mb-1 ${tone === "investor" ? "text-muted-foreground" : "text-background/60"}`}>{who}</div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
