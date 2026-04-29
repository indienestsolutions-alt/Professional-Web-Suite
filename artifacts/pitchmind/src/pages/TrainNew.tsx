import { useEffect, useMemo, useState } from "react";
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
import { Flame, Mic, ArrowRight, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function TrainNewPage() {
  const ideas = useListIdeas({ query: { queryKey: getListIdeasQueryKey() } });
  const personas = useListPersonas({
    query: { queryKey: getListPersonasQueryKey() },
  });
  const [location, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const initialIdeaId = useMemo(() => {
    const search = location.split("?")[1] ?? "";
    return new URLSearchParams(search).get("ideaId") ?? "";
  }, [location]);

  const [ideaId, setIdeaId] = useState<string>(initialIdeaId);
  const [personaSlug, setPersonaSlug] = useState<string>("");

  useEffect(() => {
    if (!ideaId && (ideas.data ?? []).length > 0) {
      setIdeaId(ideas.data![0]!.id);
    }
  }, [ideaId, ideas.data]);

  const start = useStartSession({
    mutation: {
      onSuccess: (s) => {
        qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        setLocation(`/train/${s.id}`);
      },
      onError: () =>
        toast({
          title: "Could not start session",
          variant: "destructive",
        }),
    },
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <>
            <Mic className="h-3.5 w-3.5" /> New session setup
          </>
        }
        title="Step into the arena."
        description="Pick the idea you'll defend. Pick the investor who'll push back."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-primary">
              01 — The idea
            </div>
            <h2 className="font-display text-xl font-semibold mt-1">
              Which one are you pitching?
            </h2>
            {ideas.isLoading ? (
              <div className="mt-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-md" />
                ))}
              </div>
            ) : (ideas.data ?? []).length === 0 ? (
              <div className="mt-6 p-5 rounded-lg border border-dashed border-border text-center">
                <Lightbulb className="h-5 w-5 text-muted-foreground mx-auto" />
                <p className="mt-2 font-medium">No ideas to pitch yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create an idea first — even a draft is enough to start training.
                </p>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setLocation("/ideas")}
                >
                  Create an idea
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {ideas.data!.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setIdeaId(i.id)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      ideaId === i.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/20"
                    }`}
                    data-testid={`pick-idea-${i.id}`}
                  >
                    <div className="font-medium truncate">{i.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {i.problem ?? i.rawText}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-primary">
              02 — The investor
            </div>
            <h2 className="font-display text-xl font-semibold mt-1">
              Who's grilling you today?
            </h2>
            {personas.isLoading ? (
              <div className="mt-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {(personas.data ?? []).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersonaSlug(p.slug)}
                    className={`w-full text-left p-4 rounded-md border transition-colors ${
                      personaSlug === p.slug
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-foreground/20"
                    }`}
                    data-testid={`pick-persona-${p.slug}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{p.name}</div>
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] ${
                          p.intensity === "hard"
                            ? "border-destructive text-destructive"
                            : p.intensity === "easy"
                              ? "border-emerald-500 text-emerald-600"
                              : "border-primary text-primary"
                        }`}
                      >
                        <Flame className="h-3 w-3 mr-1" />
                        {p.intensity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {p.description}
                    </p>
                    <p className="text-xs text-muted-foreground italic mt-2">
                      {p.style}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 flex items-center justify-between p-6 rounded-xl border border-border bg-secondary text-secondary-foreground"
      >
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-primary">
            Ready check
          </div>
          <p className="text-secondary-foreground/80 text-sm mt-1">
            Take a breath. Open with your strongest sentence.
          </p>
        </div>
        <Button
          size="lg"
          disabled={!ideaId || !personaSlug || start.isPending}
          onClick={() => start.mutate({ data: { ideaId, personaSlug } })}
          data-testid="start-session-button"
        >
          {start.isPending ? "Starting..." : "Start session"}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </PageContainer>
  );
}
