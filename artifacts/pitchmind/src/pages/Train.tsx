import { Link, useLocation } from "wouter";
import {
  useListSessions,
  getListSessionsQueryKey,
} from "@workspace/api-client-react";
import { PageContainer, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Plus, ArrowRight, Flame, Zap, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { formatRelative, formatScore } from "@/lib/format";

export default function TrainPage() {
  const sessions = useListSessions({
    query: { queryKey: getListSessionsQueryKey() },
  });
  const [, setLocation] = useLocation();

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <>
            <Mic className="h-3.5 w-3.5" /> Pitch arena
          </>
        }
        title="The arena"
        description="Where ideas get tested under pressure. Past sessions live here."
        actions={
          <Button onClick={() => setLocation("/train/new")} data-testid="start-new-session">
            <Plus className="h-4 w-4 mr-2" /> New session
          </Button>
        }
      />

      {sessions.isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : (sessions.data ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 px-6 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 pm-aurora opacity-50 blur-2xl -z-10" />
              <div className="h-16 w-16 rounded-2xl bg-foreground text-background flex items-center justify-center">
                <Mic className="h-7 w-7" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-semibold">
              The arena is quiet.
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md">
              Pick an idea, choose a persona, and run your first pitch. The
              feedback loop starts the moment you hit start.
            </p>
            <Button
              className="mt-6"
              onClick={() => setLocation("/train/new")}
            >
              <Plus className="h-4 w-4 mr-2" /> Start your first session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.data!.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/train/${s.id}`}>
                <a className="block">
                  <Card className="hover:border-foreground/20 transition-colors">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div
                        className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${
                          s.status === "finished"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/10 text-accent"
                        }`}
                      >
                        {s.status === "finished" ? (
                          <Trophy className="h-5 w-5" />
                        ) : (
                          <Flame className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate">
                            {s.ideaTitle ?? "Pitch session"}
                          </h3>
                          <Badge
                            variant={
                              s.status === "finished" ? "default" : "secondary"
                            }
                            className="font-mono text-[10px]"
                          >
                            {s.status === "finished" ? "FINISHED" : "ACTIVE"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          vs {s.personaName ?? s.personaSlug} ·{" "}
                          {formatRelative(s.createdAt)}
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-6 text-right">
                        <Stat label="Score" value={formatScore(s.overallScore)} />
                        <Stat
                          label="Confidence"
                          value={formatScore(s.confidenceScore)}
                        />
                        <Stat
                          label="Readiness"
                          value={formatScore(s.investorReadiness)}
                        />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </a>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-lg font-semibold">{value}</div>
    </div>
  );
}
