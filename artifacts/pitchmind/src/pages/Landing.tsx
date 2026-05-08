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
  Compass,
  GraduationCap,
  LineChart,
  Check,
  Quote,
  Star,
} from "lucide-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface PublicReview {
  id: string;
  rating: number;
  description: string;
  displayName: string | null;
  createdAt: string;
}

export default function LandingPage() {
  const { isAuthenticated, login } = useAuth();
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const apiBase = `${BASE_URL}/api`.replace("//api", "/api");
    fetch(`${apiBase}/reviews`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setReviews(data); })
      .catch(() => {});
  }, []);

  const goCTA = () => {
    if (isAuthenticated) setLocation("/dashboard");
    else login();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all ${
          scrolled
            ? "bg-background/85 backdrop-blur border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Wordmark />
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a
              href="#how"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </a>
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#personas"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Personas
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button size="sm" onClick={() => setLocation("/dashboard")}>
                Open dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => login()}
                  data-testid="header-login"
                >
                  Log in
                </Button>
                <Button size="sm" onClick={() => login()}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 overflow-hidden">
        <div className="absolute inset-0 pm-grid-bg opacity-60 pointer-events-none" />
        <motion.div
          aria-hidden
          className="absolute -top-40 -left-40 h-[600px] w-[600px] pm-aurora pointer-events-none"
          animate={{ rotate: [0, 12, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div style={{ y: heroY }} className="relative max-w-6xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 backdrop-blur px-3 py-1 text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            For student founders, by founders
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-6 text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight pm-text-balance leading-[1.02]"
          >
            Pitch like you've{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">already raised.</span>
              <span className="absolute inset-x-0 bottom-1 md:bottom-2 h-3 md:h-4 bg-accent/30 -z-0 -skew-y-2" />
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-6 text-lg md:text-2xl text-muted-foreground max-w-3xl pm-text-balance"
          >
            PitchMind turns the messy idea in your head into a structured plan,
            an investor-ready deck, and the muscle memory to defend it under
            pressure. Your personal pitch dojo.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Button size="lg" className="h-12 px-7 text-base gap-2" onClick={goCTA}>
              Build your first pitch <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-7 text-base"
              onClick={() => {
                document.querySelector("#how")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it works
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex items-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex -space-x-2">
              {[
                "from-primary to-accent",
                "from-accent to-primary",
                "from-yellow-400 to-primary",
                "from-primary to-pink-400",
              ].map((g, i) => (
                <div
                  key={i}
                  className={`h-8 w-8 rounded-full bg-gradient-to-br ${g} ring-2 ring-background`}
                />
              ))}
            </div>
            Trusted by ambitious students from clubs, accelerators, and dorm
            rooms in 14+ countries.
          </motion.div>
        </motion.div>
      </section>

      {/* MARQUEE STAT STRIP */}
      <section className="border-y border-border bg-secondary text-secondary-foreground">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid md:grid-cols-4 gap-8">
          {[
            { stat: "3 min", label: "from raw idea to structured pitch" },
            { stat: "9 slides", label: "auto-generated, founder-tested order" },
            { stat: "3 personas", label: "trained to ask the questions you fear" },
            { stat: "0 to score", label: "investor readiness, measured per turn" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="font-display text-4xl text-primary">
                {s.stat}
              </div>
              <div className="text-sm text-secondary-foreground/70 mt-1">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <SectionTitle
            eyebrow="01 — The loop"
            title="From a half-baked idea to a pitch you'd bet money on."
            description="Four steps. Same loop the best founders run, just compressed into an afternoon."
          />
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: "01",
                title: "Dump the idea",
                body:
                  "Type the rough version. Not pretty. Not edited. Just real.",
              },
              {
                num: "02",
                title: "Let it structure",
                body:
                  "AI extracts problem, solution, market, model, edge, and audience.",
              },
              {
                num: "03",
                title: "Generate the deck",
                body:
                  "Nine slides in the order investors actually expect to hear them.",
              },
              {
                num: "04",
                title: "Pitch the AI investor",
                body:
                  "Live training with personas who push back. Score every turn.",
              },
            ].map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-xl border border-border bg-card p-6"
              >
                <div className="font-mono text-xs text-primary tracking-widest">
                  STEP {s.num}
                </div>
                <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">{s.body}</p>
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
            title="Seven tools, one operating system for your idea."
            description="Built for the hardest parts of being a first-time founder — not the easy parts."
          />
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={Lightbulb}
              title="Idea structuring"
              body="Drop the raw thought. Watch it become a defensible canvas in seconds."
              tone="primary"
            />
            <FeatureCard
              icon={Presentation}
              title="Auto pitch deck"
              body="Nine slides, the order investors expect, with bullets you can actually say out loud."
              tone="accent"
            />
            <FeatureCard
              icon={Mic}
              title="AI pitch trainer"
              body="Live arena. You speak; the investor pushes back. Each turn gets scored."
              tone="primary"
            />
            <FeatureCard
              icon={Users}
              title="Investor personas"
              body="Aggressive VC. Curious angel. Skeptical judge. Three styles, three difficulties."
              tone="accent"
            />
            <FeatureCard
              icon={Compass}
              title="Mistake analysis"
              body="At the end of every session: what slipped, why it slipped, and how to fix it."
              tone="primary"
            />
            <FeatureCard
              icon={GraduationCap}
              title="Learning mode"
              body="Short, sharp lessons on TAM/SAM/SOM, validation, fundraising, and case studies."
              tone="accent"
            />
            <FeatureCard
              icon={LineChart}
              title="Progress dashboard"
              body="Confidence and clarity tracked over time so improvement is visible, not vibes."
              tone="primary"
            />
          </div>
        </div>
      </section>

      {/* PERSONAS */}
      <section id="personas" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <SectionTitle
            eyebrow="03 — The arena"
            title="Three investors. Each one trained to find the gap in your pitch."
          />
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Marcus",
                role: "Aggressive VC",
                difficulty: "Hard",
                line:
                  "Why won't a well-funded incumbent crush you in six months?",
                color: "primary",
              },
              {
                name: "Priya",
                role: "Curious Angel",
                difficulty: "Easy",
                line: "Tell me about the user you've spoken to who needed this most.",
                color: "accent",
              },
              {
                name: "Daniel",
                role: "Skeptical Judge",
                difficulty: "Medium",
                line:
                  "What assumption, if wrong, breaks the whole thesis?",
                color: "primary",
              },
            ].map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative rounded-2xl border border-border bg-card overflow-hidden"
              >
                <div
                  className={`h-32 ${
                    p.color === "primary"
                      ? "bg-gradient-to-br from-primary/30 to-primary/5"
                      : "bg-gradient-to-br from-accent/30 to-accent/5"
                  } pm-noise`}
                />
                <div className="p-6 -mt-12">
                  <div className="h-20 w-20 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center font-display text-3xl ring-4 ring-card">
                    {p.name[0]}
                  </div>
                  <div className="mt-4">
                    <div className="font-display text-xl font-semibold">
                      {p.name}
                    </div>
                    <div className="text-sm text-muted-foreground">{p.role}</div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Intensity: {p.difficulty}
                  </div>
                  <blockquote className="mt-5 text-foreground border-l-2 border-primary pl-4">
                    <Quote className="h-4 w-4 text-primary mb-2" />
                    {p.line}
                  </blockquote>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 md:py-32 bg-secondary text-secondary-foreground">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <SectionTitle
            eyebrow="04 — Voices"
            title="Founders who used to freeze on stage."
            inverted
          />
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            {[
              {
                quote:
                  "I went into my first demo day pitch knowing the answer to every question. PitchMind already asked them.",
                name: "Aisha O.",
                title: "2nd-year CS, NYU",
              },
              {
                quote:
                  "The mistake report after every session is brutal in the best way. I stopped saying 'kind of' on day three.",
                name: "Liam C.",
                title: "Founder, Loop",
              },
              {
                quote:
                  "I've never had a tutor for pitching. This is the closest thing — and it's available at 2am the night before.",
                name: "Sana M.",
                title: "High school robotics captain",
              },
              {
                quote:
                  "The deck generator gave me a structure I'd been faking for months. Real founders pitch in this order for a reason.",
                name: "Diego R.",
                title: "Pre-seed, Mexico City",
              },
            ].map((t, i) => (
              <motion.figure
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl border border-secondary-foreground/10 bg-secondary-foreground/[0.04] p-6"
              >
                <Quote className="h-5 w-5 text-primary mb-3" />
                <blockquote className="text-base md:text-lg pm-text-balance">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-4 text-sm text-secondary-foreground/70">
                  {t.name} — {t.title}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE REVIEWS MARQUEE */}
      {reviews.length > 0 && (
        <section className="py-16 border-y border-border bg-background overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8 mb-8">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              05 — Real reviews
            </div>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold tracking-tight">
              From founders who've used it.
            </h2>
          </div>
          <div className="pm-marquee-wrap">
            <div className="pm-marquee-track">
              {[...reviews, ...reviews].map((r, i) => (
                <div
                  key={`${r.id}-${i}`}
                  className="mx-3 w-72 shrink-0 rounded-2xl border border-border bg-card p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= r.rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                    {r.description}
                  </p>
                  {r.displayName && (
                    <p className="text-xs text-muted-foreground font-medium mt-auto">
                      {r.displayName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHO IT'S FOR */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <SectionTitle
              eyebrow="05 — Built for you"
              title="If your idea hasn't been pitched out loud yet, you need this most."
              description="PitchMind is engineered for the people who don't have a warm intro to a partner at a16z."
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
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <div className="absolute -inset-6 pm-aurora opacity-50 pointer-events-none" />
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-xl">
              {/* Session header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
                <div className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">M</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Marcus · Aggressive VC</p>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">ACTIVE</span>
              </div>
              {/* Turn + score bar */}
              <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border/60 bg-muted/30">
                <div className="flex gap-0.5">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className={`h-1.5 w-1.5 rounded-full ${i < 3 ? "bg-primary" : "bg-muted-foreground/20"}`} />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">3/10</span>
                <div className="w-px h-3 bg-border" />
                <span className="font-mono text-[10px] text-muted-foreground">Confidence <span className="text-foreground font-semibold">84</span></span>
                <span className="font-mono text-[10px] text-muted-foreground">Clarity <span className="text-foreground font-semibold">81</span></span>
              </div>
              {/* Messages */}
              <div className="p-4 space-y-3">
                <Bubble who="M" tone="investor">
                  Why won't a well-funded incumbent crush you in six months?
                </Bubble>
                <Bubble who="Y" tone="user">
                  We own the workflow incumbents have ignored — the segment is
                  too small for them now. By the time it's not, we'll have the
                  data moat they can't replicate fast.
                </Bubble>
                {/* Coaching pill */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-xs">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-emerald-600 mb-1">Live coaching</div>
                  <p className="text-foreground leading-relaxed">
                    Sharp and direct. Good use of moat language. Add one concrete number in the close — "by month 18 we'll have 50k data points they don't."
                  </p>
                </div>
                <Bubble who="M" tone="investor">
                  What's your CAC and what does LTV look like at 12 months?
                </Bubble>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 md:py-32 bg-card">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <SectionTitle
            eyebrow="06 — Pricing"
            title="Free to start. Always."
            description="Pro unlocks deeper analysis, more personas, and unlimited sessions when you're ready."
          />
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border p-8 bg-background">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Founder
              </div>
              <div className="mt-3 font-display text-5xl font-semibold">
                Free
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                Everything you need to ship your first real pitch.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Unlimited ideas, structuring, and decks",
                  "All three investor personas",
                  "Live mistake analysis after every session",
                  "Founder learning library",
                ].map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" size="lg" onClick={goCTA}>
                Start free
              </Button>
            </div>
            <div className="relative rounded-2xl border-2 border-primary p-8 bg-background">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest">
                Coming soon
              </div>
              <div className="font-mono text-xs uppercase tracking-widest text-primary">
                Operator
              </div>
              <div className="mt-3 font-display text-5xl font-semibold">
                $9
                <span className="text-base text-muted-foreground font-sans">
                  /mo
                </span>
              </div>
              <p className="mt-2 text-muted-foreground text-sm">
                For founders running pitches every week.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                {[
                  "Custom investor personas you design",
                  "Voice-mode pitch sessions (beta)",
                  "Cohort and team progress dashboards",
                  "Priority deck export and share links",
                ].map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-8 w-full"
                size="lg"
                onClick={goCTA}
              >
                Join the waitlist
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="relative rounded-3xl bg-secondary text-secondary-foreground p-10 md:p-16 overflow-hidden">
            <div className="absolute inset-0 pm-grid-bg opacity-20 pointer-events-none" />
            <motion.div
              aria-hidden
              className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/40 blur-3xl pointer-events-none"
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-tight pm-text-balance">
                Your first pitch is the hardest.
                <br />
                Make it the last one you wing.
              </h2>
              <p className="mt-5 text-secondary-foreground/80 text-lg max-w-2xl">
                Free to start. Three minutes from sign-up to your first
                structured pitch. No credit card.
              </p>
              <Button
                size="lg"
                className="mt-8 h-12 px-7 text-base gap-2"
                onClick={goCTA}
              >
                Start your first pitch <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Wordmark />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PitchMind. Built for the next
            generation of founders.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a
              href="#features"
              className="hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hover:text-foreground transition-colors"
            >
              Pricing
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  inverted,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  inverted?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <div
          className={`font-mono text-xs uppercase tracking-[0.2em] ${
            inverted ? "text-primary" : "text-primary"
          }`}
        >
          {eyebrow}
        </div>
      )}
      <h2 className="mt-3 font-display text-4xl md:text-5xl font-semibold tracking-tight pm-text-balance leading-[1.05]">
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-lg ${
            inverted ? "text-secondary-foreground/70" : "text-muted-foreground"
          } pm-text-balance`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: typeof Lightbulb;
  title: string;
  body: string;
  tone: "primary" | "accent";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4 }}
      className="group rounded-xl border border-border bg-background p-6 hover:border-foreground/20 transition-colors"
    >
      <div
        className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${
          tone === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-accent text-accent-foreground"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </motion.div>
  );
}

function Bubble({
  who,
  tone,
  children,
}: {
  who: string;
  tone: "investor" | "user";
  children: React.ReactNode;
}) {
  const isUser = tone === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
        isUser ? "bg-foreground text-background" : "bg-primary/15 text-primary"
      }`}>
        {who}
      </div>
      <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[85%] ${
        isUser ? "bg-foreground text-background rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
      }`}>
        {children}
      </div>
    </div>
  );
}
