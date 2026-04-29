import { useState } from "react";
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

export default function DeckViewerPage({ deckId }: { deckId: string }) {
  const deckQ = useGetDeck(deckId, {
    query: { enabled: !!deckId, queryKey: getGetDeckQueryKey(deckId) },
  });
  const [active, setActive] = useState(0);

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

      <div className="flex items-end justify-between mb-6">
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
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
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
}: {
  title: string;
  body: string;
  bullets: string[];
  layout: string;
  index: number;
  total: number;
}) {
  const isCover = layout === "title";
  return (
    <div
      className={`relative aspect-[16/10] flex flex-col p-10 md:p-14 ${
        isCover
          ? "bg-secondary text-secondary-foreground"
          : "bg-card text-foreground"
      } overflow-hidden`}
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
      <div className="relative flex items-center justify-between text-xs font-mono tracking-widest opacity-70">
        <span>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
        <span className="uppercase">{LAYOUT_LABEL[layout] ?? layout}</span>
      </div>
      <div className="relative flex-1 flex flex-col justify-center">
        <h2
          className={`font-display font-semibold tracking-tight pm-text-balance ${
            isCover ? "text-5xl md:text-6xl lg:text-7xl" : "text-4xl md:text-5xl"
          }`}
        >
          {title}
        </h2>
        <p
          className={`mt-5 max-w-2xl leading-relaxed ${
            isCover ? "text-lg md:text-xl text-secondary-foreground/80" : "text-base md:text-lg text-muted-foreground"
          }`}
        >
          {body}
        </p>
        {bullets.length > 0 && (
          <ul className="mt-6 space-y-2 max-w-2xl">
            {bullets.map((b, i) => (
              <li
                key={i}
                className="flex gap-3 text-base text-foreground"
              >
                <span className="font-mono text-primary">0{i + 1}</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="relative text-xs font-mono opacity-50">
        PitchMind ·{" "}
        {new Date().toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
        })}
      </div>
    </div>
  );
}
