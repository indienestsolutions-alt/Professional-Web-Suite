import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetIdea,
  useUpdateIdea,
  useStructureIdea,
  useValidateIdea,
  useGenerateDeck,
  useListDecksForIdea,
  getGetIdeaQueryKey,
  getListDecksForIdeaQueryKey,
  getListIdeasQueryKey,
} from "@workspace/api-client-react";
import type { IdeaValidation } from "@workspace/api-client-react";
import { PageContainer, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Presentation,
  Mic,
  Pencil,
  Save,
  ChevronLeft,
  Target,
  TrendingUp,
  Search,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelative, ideaStatusLabel } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const SECTIONS: Array<{
  key: "problem" | "solution" | "market" | "businessModel" | "competitiveEdge" | "targetAudience";
  label: string;
  hint: string;
}> = [
  { key: "problem", label: "Problem", hint: "Who feels it, when, and how badly?" },
  { key: "solution", label: "Solution", hint: "What you do — in plain language." },
  { key: "market", label: "Market", hint: "Who you sell to, and how big." },
  { key: "businessModel", label: "Business model", hint: "How money flows in, with what unit economics." },
  { key: "competitiveEdge", label: "Competitive edge", hint: "Your unfair advantage in one sentence." },
  { key: "targetAudience", label: "Target audience", hint: "The first wedge — be specific." },
];

// Deck generation phases shown in the UI
const DECK_PHASES = [
  { icon: Lightbulb, label: "Analysing your idea…", duration: 4000 },
  { icon: Search, label: "Researching the market…", duration: 8000 },
  { icon: FileText, label: "Writing investor-grade slides…", duration: 12000 },
  { icon: Sparkles, label: "Polishing the deck…", duration: 4000 },
];

function DeckGeneratingOverlay() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let acc = 0;
    DECK_PHASES.forEach((p, i) => {
      if (i === 0) return;
      acc += DECK_PHASES[i - 1]!.duration;
      timers.push(setTimeout(() => setPhase(i), acc));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const current = DECK_PHASES[phase]!;
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <Icon className="h-6 w-6 animate-pulse" />
        </div>
        <h3 className="font-semibold text-base mb-1">Generating your pitch deck</h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-muted-foreground"
          >
            {current.label}
          </motion.p>
        </AnimatePresence>

        <div className="mt-6 flex gap-1.5 justify-center">
          {DECK_PHASES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i <= phase ? "bg-primary w-6" : "bg-muted w-2"
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          This takes ~30 seconds — we're doing real market research for you.
        </p>
      </div>
    </motion.div>
  );
}

export default function IdeaDetailPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const ideaQ = useGetIdea(id, { query: { enabled: !!id, queryKey: getGetIdeaQueryKey(id) } });
  const decksQ = useListDecksForIdea(id, { query: { enabled: !!id, queryKey: getListDecksForIdeaQueryKey(id) } });

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [validation, setValidation] = useState<IdeaValidation | null>(null);

  const idea = ideaQ.data;

  useEffect(() => { setEditing(null); }, [id]);

  const update = useUpdateIdea({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetIdeaQueryKey(id) });
        qc.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        setEditing(null);
        toast({ title: "Saved" });
      },
    },
  });

  const structure = useStructureIdea({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetIdeaQueryKey(id) });
        qc.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        toast({ title: "Structured", description: "AI has shaped your idea into investor-ready sections." });
      },
    },
  });

  const validate = useValidateIdea({
    mutation: {
      onSuccess: (data) => {
        setValidation(data);
        qc.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        toast({ title: "Validation complete", description: `Score: ${Math.round(data.score)}/100` });
      },
    },
  });

  const genDeck = useGenerateDeck({
    mutation: {
      onSuccess: (deck) => {
        qc.invalidateQueries({ queryKey: getListDecksForIdeaQueryKey(id) });
        qc.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        toast({ title: "Deck ready", description: "Your investor-grade pitch deck is live." });
        setLocation(`/decks/${deck.id}`);
      },
      onError: () => {
        toast({ title: "Deck generation failed", description: "Please try again.", variant: "destructive" });
      },
    },
  });

  if (ideaQ.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-2/3 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </PageContainer>
    );
  }

  if (!idea) {
    return <PageContainer><p>Idea not found.</p></PageContainer>;
  }

  return (
    <PageContainer>
      {genDeck.isPending && <DeckGeneratingOverlay />}

      <Link href="/ideas">
        <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> All ideas
        </a>
      </Link>

      <PageHeader
        eyebrow={
          <>
            <Lightbulb className="h-3.5 w-3.5" />
            {ideaStatusLabel(idea.status)} · updated {formatRelative(idea.updatedAt)}
          </>
        }
        title={idea.title}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => structure.mutate({ id })}
              disabled={structure.isPending || genDeck.isPending}
            >
              {structure.isPending ? (
                <><Sparkles className="h-4 w-4 mr-2 animate-spin" />Structuring…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />{idea.status === "draft" ? "Structure with AI" : "Re-structure"}</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => validate.mutate({ id })}
              disabled={validate.isPending || genDeck.isPending}
            >
              {validate.isPending ? (
                <><Sparkles className="h-4 w-4 mr-2 animate-spin" />Validating…</>
              ) : (
                <><Target className="h-4 w-4 mr-2" />Validate</>
              )}
            </Button>
            <Button
              onClick={() => genDeck.mutate({ id })}
              disabled={genDeck.isPending}
            >
              <Presentation className="h-4 w-4 mr-2" />
              {genDeck.isPending ? "Generating…" : "Generate deck"}
            </Button>
          </>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Raw idea</div>
          <p className="text-foreground whitespace-pre-wrap leading-relaxed">{idea.rawText}</p>
        </CardContent>
      </Card>

      <AnimatePresence>
        {validation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6"
          >
            <Card className="border-primary/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-mono text-xs uppercase tracking-widest text-primary">Validation report</div>
                    <h3 className="font-display text-xl font-semibold mt-1">Investor readiness score</h3>
                  </div>
                  <div className="font-display text-5xl font-semibold text-primary shrink-0">
                    {Math.round(validation.score)}
                    <span className="text-base text-muted-foreground font-sans ml-1">/100</span>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <ValidationList title="Strengths" icon={<CheckCircle2 className="h-4 w-4" />} tone="primary" items={validation.strengths} />
                  <ValidationList title="Weaknesses" icon={<AlertTriangle className="h-4 w-4" />} tone="destructive" items={validation.weaknesses} />
                  <ValidationList title="Suggestions" icon={<TrendingUp className="h-4 w-4" />} tone="accent" items={validation.suggestions} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {SECTIONS.map((sec, i) => {
          const value = idea[sec.key];
          const isEditing = editing === sec.key;
          return (
            <motion.div
              key={sec.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="h-full">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-mono text-xs uppercase tracking-widest text-primary">{sec.label}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{sec.hint}</p>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground shrink-0"
                        onClick={() => { setEditing(sec.key); setDraft(value ?? ""); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-4">
                    {isEditing ? (
                      <div>
                        <Textarea
                          rows={5}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="resize-none"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => update.mutate({ id, data: { [sec.key]: draft } })}
                            disabled={update.isPending}
                          >
                            <Save className="h-3.5 w-3.5 mr-1.5" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : value ? (
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{value}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Not yet defined. Run AI structuring or write it yourself.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Pitch arena</div>
            <h3 className="font-display text-lg font-semibold mt-1">Defend it live</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Pick an investor persona and pitch this idea out loud. We'll score every turn.
            </p>
            <Button className="mt-4 w-full" onClick={() => setLocation(`/train/new?ideaId=${idea.id}`)}>
              <Mic className="h-4 w-4 mr-2" /> Start session
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Decks for this idea</div>
                <h3 className="font-display text-lg font-semibold mt-1">Pitch decks</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => genDeck.mutate({ id })}
                disabled={genDeck.isPending}
              >
                <Presentation className="h-4 w-4 mr-2" />
                {genDeck.isPending ? "Generating…" : "Generate new"}
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {decksQ.isLoading ? (
                <Skeleton className="h-12 rounded-md" />
              ) : (decksQ.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No decks yet. Generate one above to get your investor-ready pitch outline.
                </p>
              ) : (
                decksQ.data!.map((d) => (
                  <Link key={d.id} href={`/decks/${d.id}`}>
                    <a className="flex items-center justify-between p-3 rounded-md border border-border hover:border-foreground/20 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Presentation className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{d.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {d.slides.length} slides · {formatRelative(d.createdAt)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] shrink-0 ml-2">OPEN</Badge>
                    </a>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function ValidationList({
  title, items, icon, tone,
}: { title: string; items: string[]; icon: React.ReactNode; tone: "primary" | "destructive" | "accent" }) {
  const cls = tone === "primary" ? "text-primary" : tone === "destructive" ? "text-destructive" : "text-accent";
  return (
    <div className="rounded-lg border border-border p-4">
      <div className={`flex items-center gap-2 text-sm font-semibold ${cls}`}>{icon}{title}</div>
      <ul className="mt-3 space-y-2 text-sm">
        {items.length === 0 && <li className="text-muted-foreground italic">None.</li>}
        {items.map((it, i) => <li key={i} className="text-foreground">• {it}</li>)}
      </ul>
    </div>
  );
}
