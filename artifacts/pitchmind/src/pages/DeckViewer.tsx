import { useState, useRef } from "react";
import { Link } from "wouter";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LAYOUT_LABEL: Record<string, string> = {
  title: "Cover",
  problem: "Problem",
  solution: "Solution",
  market: "Market",
  business: "Business model",
  edge: "Competitive edge",
  demo: "Demo",
  traction: "Traction & roadmap",
  ask: "The ask",
};

const LAYOUT_ACCENT: Record<string, string> = {
  title: "from-primary/20 to-primary/5",
  problem: "from-destructive/15 to-destructive/5",
  solution: "from-emerald-500/15 to-emerald-500/5",
  market: "from-blue-500/15 to-blue-500/5",
  business: "from-purple-500/15 to-purple-500/5",
  edge: "from-amber-500/15 to-amber-500/5",
  demo: "from-cyan-500/15 to-cyan-500/5",
  traction: "from-indigo-500/15 to-indigo-500/5",
  ask: "from-primary/20 to-primary/5",
};

export default function DeckViewerPage({ deckId }: { deckId: string }) {
  const deckQ = useGetDeck(deckId, {
    query: { enabled: !!deckId, queryKey: getGetDeckQueryKey(deckId) },
  });
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!deckQ.data) return;
    const deck = deckQ.data;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${deck.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #09090b; color: #fafafa; }
    .slide { width: 100%; min-height: 100vh; display: flex; flex-direction: column; padding: 64px; page-break-after: always; position: relative; }
    .slide-cover { background: linear-gradient(135deg, #18181b 0%, #09090b 100%); }
    .slide-content { background: #111113; border-bottom: 1px solid #27272a; }
    .slide-number { font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; margin-bottom: auto; }
    .slide-label { font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; }
    .slide-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
    .slide-body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
    .slide-title { font-size: 48px; font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; color: #fafafa; margin-bottom: 24px; }
    .slide-title-cover { font-size: 72px; }
    .slide-desc { font-size: 18px; color: #a1a1aa; line-height: 1.7; max-width: 700px; margin-bottom: 32px; }
    .bullet-list { list-style: none; }
    .bullet-item { display: flex; gap: 16px; margin-bottom: 12px; font-size: 16px; color: #d4d4d8; }
    .bullet-num { font-family: monospace; color: #a78bfa; flex-shrink: 0; }
    .accent-bar { width: 64px; height: 4px; background: #a78bfa; border-radius: 2px; margin-bottom: 32px; }
    .footer { font-family: monospace; font-size: 11px; color: #52525b; margin-top: auto; padding-top: 32px; border-top: 1px solid #27272a; }
    @media print { .slide { page-break-after: always; min-height: 100vh; } }
  </style>
</head>
<body>
${deck.slides.map((slide, i) => `
  <div class="slide ${slide.layout === 'title' ? 'slide-cover' : 'slide-content'}">
    <div class="slide-header">
      <span class="slide-number">${String(i + 1).padStart(2, '0')} / ${String(deck.slides.length).padStart(2, '0')}</span>
      <span class="slide-label">${LAYOUT_LABEL[slide.layout] ?? slide.layout}</span>
    </div>
    <div class="slide-body">
      <div class="accent-bar"></div>
      <h2 class="slide-title ${slide.layout === 'title' ? 'slide-title-cover' : ''}">${slide.title}</h2>
      <p class="slide-desc">${slide.body}</p>
      ${slide.bullets && slide.bullets.length > 0 ? `
      <ul class="bullet-list">
        ${slide.bullets.map((b, bi) => `<li class="bullet-item"><span class="bullet-num">0${bi + 1}</span><span>${b}</span></li>`).join('')}
      </ul>` : ''}
    </div>
    <div class="footer">PitchMind · ${deck.title} · ${new Date().toLocaleDateString('en', { year: 'numeric', month: 'long' })}</div>
  </div>
`).join('')}
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
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </PageContainer>
    );
  }

  const deck = deckQ.data;
  if (!deck) {
    return (
      <PageContainer>
        <p>Deck not found.</p>
      </PageContainer>
    );
  }

  const slide = deck.slides[active];
  const total = deck.slides.length;

  return (
    <PageContainer>
      <Link href={`/ideas/${deck.ideaId}`}>
        <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to idea
        </a>
      </Link>

      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            <Presentation className="h-3.5 w-3.5 inline mr-1" />
            Pitch deck preview
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2 tracking-tight">
            {deck.title}
          </h1>
          {deck.storyline && (
            <p className="text-muted-foreground mt-2 max-w-2xl">
              {deck.storyline}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen preview"}
          >
            <Maximize2 className="h-3.5 w-3.5 mr-1" />
            {fullscreen ? "Exit" : "Fullscreen"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            title="Download pitch deck as HTML (open in browser and print to PDF)"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            Download
          </Button>
        </div>
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-background flex flex-col"
          onClick={() => setFullscreen(false)}
        >
          <div className="flex-1 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {String(active + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} · {LAYOUT_LABEL[slide.layout] ?? slide.layout}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setActive((i) => Math.max(0, i - 1))} disabled={active === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActive((i) => Math.min(total - 1, i + 1))} disabled={active === total - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setFullscreen(false)}>Close</Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <SlideRender
                title={slide.title}
                body={slide.body}
                bullets={slide.bullets ?? []}
                layout={slide.layout}
                index={active}
                total={total}
                fullscreen
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[280px_1fr] gap-6" ref={deckRef}>
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
          {deck.slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                i === active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-foreground/20"
              }`}
              data-testid={`slide-thumb-${i}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Badge variant="outline" className="font-mono text-[9px]">
                  {LAYOUT_LABEL[s.layout] ?? s.layout}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium line-clamp-2">{s.title}</p>
            </button>
          ))}
        </div>

        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <SlideRender
                    title={slide.title}
                    body={slide.body}
                    bullets={slide.bullets ?? []}
                    layout={slide.layout}
                    index={active}
                    total={total}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setActive((i) => Math.max(0, i - 1))}
              disabled={active === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="font-mono text-sm text-muted-foreground">
              {active + 1} / {total}
            </div>
            <Button
              onClick={() => setActive((i) => Math.min(total - 1, i + 1))}
              disabled={active === total - 1}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function SlideRender({
  title,
  body,
  bullets,
  layout,
  index,
  total,
  fullscreen,
}: {
  title: string;
  body: string;
  bullets: string[];
  layout: string;
  index: number;
  total: number;
  fullscreen?: boolean;
}) {
  const isCover = layout === "title";
  const accentGradient = LAYOUT_ACCENT[layout] ?? LAYOUT_ACCENT["solution"]!;

  return (
    <div
      className={`relative flex flex-col ${fullscreen ? "h-full" : "aspect-[16/10]"} p-10 md:p-14 overflow-hidden ${
        isCover ? "bg-secondary text-secondary-foreground" : "bg-card text-foreground"
      }`}
    >
      {isCover && (
        <>
          <div className="absolute inset-0 pm-grid-bg opacity-20 pointer-events-none" />
          <motion.div
            aria-hidden
            className="absolute -top-32 -right-32 h-96 w-96 pm-aurora pointer-events-none"
            animate={{ rotate: [0, 8, 0] }}
            transition={{ duration: 18, repeat: Infinity }}
          />
        </>
      )}

      {!isCover && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${accentGradient} pointer-events-none`}
        />
      )}

      <div className="relative flex items-center justify-between text-xs font-mono tracking-widest opacity-70 shrink-0">
        <span>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="uppercase">{LAYOUT_LABEL[layout] ?? layout}</span>
      </div>

      <div className="relative flex-1 flex flex-col justify-center min-h-0">
        {!isCover && (
          <div className="w-12 h-1 bg-primary rounded-full mb-6 shrink-0" />
        )}
        <h2
          className={`font-display font-semibold tracking-tight pm-text-balance shrink-0 ${
            isCover
              ? "text-4xl md:text-5xl lg:text-6xl"
              : "text-3xl md:text-4xl"
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-4 max-w-2xl leading-relaxed shrink-0 ${
            isCover
              ? "text-base md:text-lg text-secondary-foreground/80"
              : "text-sm md:text-base text-muted-foreground"
          }`}
        >
          {body}
        </p>
        {bullets.length > 0 && (
          <ul className="mt-5 space-y-2 max-w-2xl">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm md:text-base text-foreground"
              >
                <span className="font-mono text-primary shrink-0">0{i + 1}</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative text-xs font-mono opacity-50 shrink-0">
        PitchMind ·{" "}
        {new Date().toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
        })}
      </div>
    </div>
  );
}
