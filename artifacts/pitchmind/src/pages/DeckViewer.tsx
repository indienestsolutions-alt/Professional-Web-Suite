import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetDeck,
  getGetDeckQueryKey,
} from "@workspace/api-client-react";
import { PageContainer } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Presentation,
  ArrowLeft,
  Download,
  Maximize2,
  Minimize2,
  Mic,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LAYOUT_LABEL: Record<string, string> = {
  title: "Cover",
  problem: "The Problem",
  solution: "Our Solution",
  market: "Market Opportunity",
  business: "Business Model",
  edge: "Why We Win",
  demo: "Product Demo",
  traction: "Traction",
  ask: "The Ask",
};

const LAYOUT_ACCENT: Record<string, { gradient: string; bar: string; badge: string }> = {
  title:    { gradient: "from-primary/20 via-primary/5 to-transparent",      bar: "bg-primary",      badge: "bg-primary/15 text-primary" },
  problem:  { gradient: "from-red-500/15 via-red-500/5 to-transparent",      bar: "bg-red-500",      badge: "bg-red-500/15 text-red-500" },
  solution: { gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent", bar: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-500" },
  market:   { gradient: "from-blue-500/15 via-blue-500/5 to-transparent",    bar: "bg-blue-500",     badge: "bg-blue-500/15 text-blue-500" },
  business: { gradient: "from-purple-500/15 via-purple-500/5 to-transparent", bar: "bg-purple-500",  badge: "bg-purple-500/15 text-purple-500" },
  edge:     { gradient: "from-amber-500/15 via-amber-500/5 to-transparent",  bar: "bg-amber-500",    badge: "bg-amber-500/15 text-amber-500" },
  demo:     { gradient: "from-cyan-500/15 via-cyan-500/5 to-transparent",    bar: "bg-cyan-500",     badge: "bg-cyan-500/15 text-cyan-500" },
  traction: { gradient: "from-indigo-500/15 via-indigo-500/5 to-transparent", bar: "bg-indigo-500",  badge: "bg-indigo-500/15 text-indigo-500" },
  ask:      { gradient: "from-primary/20 via-primary/5 to-transparent",      bar: "bg-primary",      badge: "bg-primary/15 text-primary" },
};

interface DeckSlide {
  title: string;
  body: string;
  layout: string;
  bullets?: string[];
  stat?: string;
  statLabel?: string;
}

export default function DeckViewerPage({ deckId }: { deckId: string }) {
  const [, setLocation] = useLocation();
  const deckQ = useGetDeck(deckId, {
    query: { enabled: !!deckId, queryKey: getGetDeckQueryKey(deckId) },
  });
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const slides = (deckQ.data?.slides ?? []) as DeckSlide[];
  const total = slides.length;

  const goNext = useCallback(() => setActive((i) => Math.min(total - 1, i + 1)), [total]);
  const goPrev = useCallback(() => setActive((i) => Math.max(0, i - 1)), []);

  // Keyboard navigation for fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen, goNext, goPrev]);

  const handleDownload = () => {
    if (!deckQ.data) return;
    const deck = deckQ.data;
    const deckSlides = deck.slides as DeckSlide[];

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${deck.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #09090b; color: #fafafa; }
    .slide { width: 100%; min-height: 100vh; display: flex; flex-direction: column; padding: 72px 80px; page-break-after: always; position: relative; overflow: hidden; }
    .slide-cover { background: linear-gradient(135deg, #1a0e08 0%, #09090b 60%, #0a0a12 100%); }
    .slide-content { background: #111113; }
    .accent-strip { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .slide-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 56px; }
    .slide-num { font-family: 'Space Grotesk', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; color: #52525b; }
    .slide-label { font-family: 'Space Grotesk', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #52525b; }
    .slide-body { flex: 1; display: flex; flex-direction: column; justify-content: center; max-width: 820px; }
    .accent-bar { width: 48px; height: 3px; background: #f97316; border-radius: 2px; margin-bottom: 28px; }
    .slide-title { font-family: 'Space Grotesk', sans-serif; font-size: 52px; font-weight: 700; line-height: 1.05; letter-spacing: -0.03em; color: #fafafa; margin-bottom: 20px; }
    .slide-title-cover { font-size: 72px; letter-spacing: -0.04em; }
    .slide-desc { font-size: 17px; color: #a1a1aa; line-height: 1.75; max-width: 680px; margin-bottom: 32px; }
    .stat-block { display: inline-flex; flex-direction: column; background: rgba(249,115,22,0.08); border: 1px solid rgba(249,115,22,0.2); border-radius: 12px; padding: 16px 24px; margin-bottom: 28px; }
    .stat-value { font-family: 'Space Grotesk', monospace; font-size: 36px; font-weight: 700; color: #f97316; line-height: 1; }
    .stat-label { font-family: 'Space Grotesk', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; margin-top: 4px; }
    .bullet-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .bullet-item { display: flex; gap: 16px; font-size: 16px; color: #d4d4d8; align-items: flex-start; }
    .bullet-num { font-family: 'Space Grotesk', monospace; color: #f97316; flex-shrink: 0; font-weight: 600; width: 24px; }
    .footer { margin-top: auto; padding-top: 40px; display: flex; justify-content: space-between; align-items: center; }
    .footer-text { font-family: 'Space Grotesk', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #3f3f46; }
    .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; }
    @media print { .slide { page-break-after: always; min-height: 100vh; } }
  </style>
</head>
<body>
${deckSlides.map((slide, i) => {
  const isCover = slide.layout === "title";
  const accent = LAYOUT_ACCENT[slide.layout] ?? LAYOUT_ACCENT["solution"]!;
  const colors: Record<string, string> = {
    "bg-primary": "#f97316", "bg-red-500": "#ef4444", "bg-emerald-500": "#10b981",
    "bg-blue-500": "#3b82f6", "bg-purple-500": "#a855f7", "bg-amber-500": "#f59e0b",
    "bg-cyan-500": "#06b6d4", "bg-indigo-500": "#6366f1",
  };
  const color = colors[accent.bar] ?? "#f97316";
  return `
  <div class="slide ${isCover ? "slide-cover" : "slide-content"}">
    ${isCover ? '<div class="grid-bg"></div>' : ""}
    <div class="accent-strip" style="background: linear-gradient(90deg, ${color}, transparent)"></div>
    <div class="slide-header">
      <span class="slide-num">${String(i + 1).padStart(2, "0")} / ${String(deckSlides.length).padStart(2, "0")}</span>
      <span class="slide-label">${LAYOUT_LABEL[slide.layout] ?? slide.layout}</span>
    </div>
    <div class="slide-body">
      ${!isCover ? `<div class="accent-bar" style="background:${color}"></div>` : ""}
      <h2 class="slide-title ${isCover ? "slide-title-cover" : ""}">${slide.title}</h2>
      ${slide.stat ? `<div class="stat-block"><span class="stat-value">${slide.stat}</span><span class="stat-label">${slide.statLabel ?? ""}</span></div>` : ""}
      <p class="slide-desc">${slide.body}</p>
      ${slide.bullets && slide.bullets.length > 0 ? `<ul class="bullet-list">${slide.bullets.map((b, bi) => `<li class="bullet-item"><span class="bullet-num">0${bi + 1}</span><span>${b}</span></li>`).join("")}</ul>` : ""}
    </div>
    <div class="footer">
      <span class="footer-text">PitchMind AI</span>
      <span class="footer-text">${deck.title} · ${new Date().toLocaleDateString("en", { year: "numeric", month: "long" })}</span>
    </div>
  </div>`;
}).join("")}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.title.replace(/[^a-z0-9]/gi, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (deckQ.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </PageContainer>
    );
  }

  const deck = deckQ.data;
  if (!deck) {
    return <PageContainer><p className="text-muted-foreground">Deck not found.</p></PageContainer>;
  }

  const slide = slides[active];

  return (
    <PageContainer>
      <Link href={`/ideas/${deck.ideaId}`}>
        <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-5">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to idea
        </a>
      </Link>

      <div className="flex items-end justify-between mb-5 flex-wrap gap-4">
        <div className="min-w-0">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
            <Presentation className="h-3.5 w-3.5" />
            Pitch deck · {total} slides
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold mt-1.5 tracking-tight truncate">
            {deck.title}
          </h1>
          {deck.storyline && (
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{deck.storyline}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button onClick={() => setLocation(`/train/new?ideaId=${deck.ideaId}`)}>
            <Mic className="h-3.5 w-3.5 mr-1.5" />
            Practice this pitch
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFullscreen(true)} title="Fullscreen — use ← → to navigate">
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            Present
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} title="Download as HTML — open in browser and print to PDF">
            <Download className="h-3.5 w-3.5 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {/* Fullscreen presentation mode */}
      <AnimatePresence>
        {fullscreen && slide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/90 backdrop-blur shrink-0">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {LAYOUT_LABEL[slide.layout] ?? slide.layout}
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={goPrev} disabled={active === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={goNext} disabled={active === total - 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setFullscreen(false)}>
                    <Minimize2 className="h-4 w-4 mr-1" /> Exit
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.16 }}
                    className="h-full"
                  >
                    <SlideRender slide={slide} index={active} total={total} fullscreen />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <div className="shrink-0 text-center py-1.5 text-xs text-muted-foreground/50 font-mono">
              ← → arrow keys · Space · Esc to exit
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        {/* Slide nav */}
        <div className="space-y-1.5 lg:max-h-[600px] overflow-y-auto pr-1">
          {slides.map((s, i) => {
            const acc = LAYOUT_ACCENT[s.layout] ?? LAYOUT_ACCENT["solution"]!;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  i === active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${acc.badge}`}>
                    {LAYOUT_LABEL[s.layout] ?? s.layout}
                  </span>
                  {s.stat && (
                    <span className="ml-auto text-[9px] font-mono text-primary truncate max-w-[80px]">{s.stat}</span>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-medium line-clamp-1">{s.title}</p>
              </button>
            );
          })}
        </div>

        {/* Main slide view */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {slide && (
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                <Card className="overflow-hidden shadow-lg">
                  <CardContent className="p-0">
                    <SlideRender slide={slide} index={active} total={total} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-between">
            <Button variant="outline" onClick={goPrev} disabled={active === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="flex gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-6 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
            <Button onClick={goNext} disabled={active === total - 1}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function SlideRender({
  slide,
  index,
  total,
  fullscreen,
}: {
  slide: DeckSlide;
  index: number;
  total: number;
  fullscreen?: boolean;
}) {
  const isCover = slide.layout === "title";
  const acc = LAYOUT_ACCENT[slide.layout] ?? LAYOUT_ACCENT["solution"]!;

  return (
    <div
      className={`relative flex flex-col overflow-hidden ${
        fullscreen ? "h-full" : "aspect-[16/10]"
      } ${isCover ? "bg-secondary text-secondary-foreground" : "bg-card text-foreground"}`}
    >
      {/* Accent strip */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${acc.bar} opacity-80`} />

      {/* Background */}
      {isCover ? (
        <>
          <div className="absolute inset-0 pm-grid-bg opacity-[0.06] pointer-events-none" />
          <motion.div
            aria-hidden
            className="absolute -top-40 -right-40 h-[500px] w-[500px] pm-aurora pointer-events-none opacity-40"
            animate={{ rotate: [0, 6, 0] }}
            transition={{ duration: 20, repeat: Infinity }}
          />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${acc.gradient} pointer-events-none`} />
      )}

      <div className="relative flex flex-col h-full p-8 md:p-12 lg:p-14">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 mb-6">
          <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className={`text-[9px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded ${acc.badge}`}>
            {LAYOUT_LABEL[slide.layout] ?? slide.layout}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center min-h-0">
          {!isCover && <div className={`w-10 h-[3px] ${acc.bar} rounded-full mb-5 shrink-0`} />}

          <h2
            className={`font-display font-bold tracking-tight pm-text-balance shrink-0 ${
              isCover
                ? "text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
                : "text-2xl md:text-3xl lg:text-4xl"
            }`}
          >
            {slide.title}
          </h2>

          {slide.stat && (
            <div className="mt-4 inline-flex flex-col shrink-0">
              <span className={`font-mono font-bold leading-none ${isCover ? "text-2xl md:text-3xl" : "text-xl md:text-2xl"} text-primary`}>
                {slide.stat}
              </span>
              {slide.statLabel && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                  {slide.statLabel}
                </span>
              )}
            </div>
          )}

          <p
            className={`mt-4 max-w-2xl leading-relaxed shrink-0 ${
              isCover
                ? "text-sm md:text-base text-secondary-foreground/75"
                : "text-xs md:text-sm text-muted-foreground"
            }`}
          >
            {slide.body}
          </p>

          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="mt-5 space-y-2 max-w-2xl">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-xs md:text-sm text-foreground items-start">
                  <span className={`font-mono font-semibold shrink-0 ${acc.bar.replace("bg-", "text-")}`}>
                    0{i + 1}
                  </span>
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between mt-4">
          <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">PitchMind AI</span>
          <span className="text-[9px] font-mono text-muted-foreground/40">
            {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long" })}
          </span>
        </div>
      </div>
    </div>
  );
}
