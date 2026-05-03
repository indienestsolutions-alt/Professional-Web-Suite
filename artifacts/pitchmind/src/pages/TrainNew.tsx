import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListIdeas,
  useListPersonas,
  useStartSession,
  getListIdeasQueryKey,
  getListPersonasQueryKey,
  getListSessionsQueryKey,
} from "@workspace/api-client-react";
import { PageContainer, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Flame, Mic, ArrowRight, Lightbulb, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function TrainNewPage() {
  const ideas = useListIdeas({ query: { queryKey: getListIdeasQueryKey() } });
  const personas = useListPersonas({ query: { queryKey: getListPersonasQueryKey() } });
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const initialIdeaId = useMemo(() => {
    const search = location.split("?")[1] ?? "";
    return new URLSearchParams(search).get("ideaId") ?? "";
  }, [location]);

  const [ideaId, setIdeaId] = useState<string>(initialIdeaId);
  const [personaSlug, setPersonaSlug] = useState<string>("");
  const [ownDeck, setOwnDeck] = useState("");
  const [ownDeckFileName, setOwnDeckFileName] = useState("");
  const [showDeck, setShowDeck] = useState(false);
  const [deckMode, setDeckMode] = useState<"upload" | "paste">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name;
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext !== "txt" && ext !== "md") {
      toast({ title: "Unsupported file type", description: "Upload a .txt or .md file, or paste your deck text below.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setOwnDeck(text);
      setOwnDeckFileName(name);
    };
    reader.readAsText(file);
  }

  function clearDeck() {
    setOwnDeck("");
    setOwnDeckFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    if (!ideaId && (ideas.data ?? []).length > 0) setIdeaId(ideas.data![0]!.id);
  }, [ideaId, ideas.data]);

  const start = useStartSession({
    mutation: {
      onSuccess: (s) => {
        qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        setLocation(`/train/${s.id}`);
      },
      onError: () => toast({ title: "Could not start session", variant: "destructive" }),
    },
  });

  const canStart = !!ideaId && !!personaSlug && !start.isPending;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<><Mic className="h-3.5 w-3.5" /> New session</>}
        title="Set up your session"
        description="Choose an idea and an investor, then start pitching."
      />

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Step 1 — Idea */}
        <Card>
          <CardContent className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">01 — Your idea</p>
            <h2 className="font-semibold text-base mb-4">Which idea are you pitching?</h2>
            {ideas.isLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
            ) : (ideas.data ?? []).length === 0 ? (
              <div className="p-5 rounded-xl border border-dashed text-center">
                <Lightbulb className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium text-sm">No ideas yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Create an idea first — even a rough one works.</p>
                <Button size="sm" onClick={() => setLocation("/ideas")}>Create an idea</Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                {ideas.data!.map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => setIdeaId(idea.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      ideaId === idea.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{idea.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {idea.problem ?? idea.rawText}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Own deck upload */}
            <div className="mt-4 border-t border-border pt-4">
              <button
                onClick={() => setShowDeck((v) => !v)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <Upload className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">
                  Upload your pitch deck{ownDeck ? " · ✓ loaded" : " (optional)"}
                </span>
                {showDeck ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <AnimatePresence>
                {showDeck && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Upload your deck as a text file and the AI investor will ask questions directly tied to your content — not just the idea.
                      </p>

                      {/* Tab toggle */}
                      <div className="flex rounded-md overflow-hidden border border-border text-xs font-medium">
                        <button
                          onClick={() => setDeckMode("upload")}
                          className={`flex-1 py-1.5 transition-colors ${deckMode === "upload" ? "bg-foreground text-background" : "hover:bg-muted"}`}
                        >
                          Upload file
                        </button>
                        <button
                          onClick={() => setDeckMode("paste")}
                          className={`flex-1 py-1.5 transition-colors ${deckMode === "paste" ? "bg-foreground text-background" : "hover:bg-muted"}`}
                        >
                          Paste text
                        </button>
                      </div>

                      {deckMode === "upload" ? (
                        ownDeckFileName ? (
                          <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm">
                            <Upload className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="flex-1 truncate text-emerald-800 font-medium">{ownDeckFileName}</span>
                            <span className="text-emerald-600 text-xs">{ownDeck.trim().split(/\s+/).filter(Boolean).length} words</span>
                            <button onClick={clearDeck} className="text-emerald-600 hover:text-destructive">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".txt,.md"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="deck-file-input"
                            />
                            <label
                              htmlFor="deck-file-input"
                              className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors text-center"
                            >
                              <Upload className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Click to upload</p>
                                <p className="text-xs text-muted-foreground mt-0.5">.txt or .md files supported</p>
                              </div>
                            </label>
                            <p className="text-[11px] text-muted-foreground mt-2 text-center">
                              Have a PDF? Copy the text from it and use the "Paste text" tab.
                            </p>
                          </div>
                        )
                      ) : (
                        <div>
                          <Textarea
                            value={ownDeck}
                            onChange={(e) => { setOwnDeck(e.target.value); setOwnDeckFileName(""); }}
                            placeholder="Paste your pitch deck content here — slide text, bullet points, key numbers, anything…"
                            rows={6}
                            className="text-sm resize-none"
                          />
                          {ownDeck.length > 0 && (
                            <p className="text-xs text-muted-foreground text-right mt-1">
                              {ownDeck.trim().split(/\s+/).filter(Boolean).length} words
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 — Investor */}
        <Card>
          <CardContent className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary mb-1">02 — The investor</p>
            <h2 className="font-semibold text-base mb-4">Who's grilling you today?</h2>
            {personas.isLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
            ) : (
              <div className="space-y-2">
                {(personas.data ?? []).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersonaSlug(p.slug)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      personaSlug === p.slug
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{p.name}</p>
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] ${
                          p.intensity === "hard" ? "border-destructive text-destructive"
                            : p.intensity === "easy" ? "border-emerald-500 text-emerald-600"
                            : "border-primary text-primary"
                        }`}
                      >
                        <Flame className="h-2.5 w-2.5 mr-1" />{p.intensity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <p className="text-xs text-muted-foreground/70 italic mt-1">&ldquo;{p.style}&rdquo;</p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Start */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 flex items-center justify-between gap-4 p-5 rounded-xl border border-border bg-secondary text-secondary-foreground flex-wrap"
      >
        <div>
          <p className="font-semibold text-sm">Ready?</p>
          <p className="text-secondary-foreground/70 text-xs mt-0.5">
            {!ideaId ? "Pick an idea above first." : !personaSlug ? "Pick an investor above." : "Take a breath. Start with your strongest sentence."}
          </p>
        </div>
        <Button
          size="lg"
          disabled={!canStart}
          onClick={() =>
            start.mutate({
              data: {
                ideaId,
                personaSlug,
                ownDeckContent: ownDeck.trim() || undefined,
              },
            })
          }
        >
          {start.isPending ? "Starting…" : "Start session"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </PageContainer>
  );
}
