import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSession,
  useSendSessionMessage,
  useFinishSession,
  getGetSessionQueryKey,
  getListSessionsQueryKey,
} from "@workspace/api-client-react";
import type {
  PitchSessionDetail,
  SessionMessage,
} from "@workspace/api-client-react";
import { PageContainer } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mic,
  ArrowLeft,
  Send,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatScore } from "@/lib/format";

export default function TrainSessionPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const sessionQ = useGetSession(id, {
    query: { enabled: !!id, queryKey: getGetSessionQueryKey(id) },
  });
  const [draft, setDraft] = useState("");
  const [, setLocation] = useLocation();
  const transcriptRef = useRef<HTMLDivElement>(null);

  const send = useSendSessionMessage({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
        setDraft("");
      },
    },
  });

  const finish = useFinishSession({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
        qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      },
    },
  });

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [sessionQ.data?.messages?.length]);

  if (sessionQ.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-[480px] rounded-xl" />
      </PageContainer>
    );
  }

  const session = sessionQ.data;
  if (!session) {
    return (
      <PageContainer>
        <p>Session not found.</p>
      </PageContainer>
    );
  }

  const finished = session.status === "finished";

  return (
    <PageContainer>
      <Link href="/train">
        <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> All sessions
        </a>
      </Link>

      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary inline-flex items-center gap-2">
            <Mic className="h-3.5 w-3.5" /> Pitch arena ·{" "}
            {finished ? "FINISHED" : "LIVE"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2 tracking-tight">
            vs {session.personaName ?? session.personaSlug}
          </h1>
          <p className="text-muted-foreground mt-1">
            Pitching:{" "}
            <Link href={`/ideas/${session.ideaId}`}>
              <a className="text-foreground hover:underline">
                {session.ideaTitle}
              </a>
            </Link>
          </p>
        </div>
        {!finished && (
          <Button
            variant="outline"
            onClick={() => finish.mutate({ id })}
            disabled={finish.isPending}
            data-testid="end-session-button"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {finish.isPending ? "Wrapping up..." : "End session & get report"}
          </Button>
        )}
      </div>

      {finished && (
        <FinishedReport session={session} onRestart={() => setLocation("/train/new")} />
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0 flex flex-col h-[640px]">
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-card"
            >
              {(session.messages ?? []).map((m) => (
                <Message key={m.id} m={m} />
              ))}
            </div>
            {!finished && (
              <div className="border-t border-border p-4 bg-background">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="Pitch your turn. Lead with your strongest sentence..."
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      (e.metaKey || e.ctrlKey) &&
                      draft.trim().length > 0
                    ) {
                      send.mutate({ id, data: { content: draft.trim() } });
                    }
                  }}
                  data-testid="pitch-input"
                />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>
                    Tip: cmd/ctrl + Enter to send. Pause for a beat between
                    answers.
                  </span>
                  <Button
                    size="sm"
                    onClick={() =>
                      send.mutate({ id, data: { content: draft.trim() } })
                    }
                    disabled={send.isPending || draft.trim().length === 0}
                    data-testid="send-pitch-button"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Session scoring
              </div>
              <div className="mt-3 space-y-3">
                <Score
                  label="Confidence"
                  value={session.confidenceScore ?? null}
                />
                <Score label="Clarity" value={session.clarityScore ?? null} />
                <Score
                  label="Investor readiness"
                  value={session.investorReadiness ?? null}
                />
              </div>
              {session.overallScore != null && (
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Overall
                  </div>
                  <div className="font-display text-4xl font-semibold mt-1 text-primary">
                    {Math.round(session.overallScore)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Persona style
              </div>
              <p className="mt-3 text-sm text-foreground">
                {session.personaName ?? session.personaSlug} is here to find
                the weakest answer in your pitch and pull on it. Stay calm.
                Pause before answering. Lead with the claim, not the hedge.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function Message({ m }: { m: SessionMessage }) {
  if (m.role === "system") {
    return (
      <div className="flex justify-center">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full inline-flex items-center gap-2">
          <Sparkles className="h-3 w-3" />
          {m.content}
        </div>
      </div>
    );
  }
  const isUser = m.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {isUser ? "You" : "Investor"}
        </div>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-foreground text-background rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          }`}
        >
          {m.content}
        </div>
        {isUser && m.feedback && (
          <div className="mt-1 max-w-full rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
            <div className="flex items-center gap-2 text-primary font-semibold mb-1">
              <Sparkles className="h-3 w-3" /> Live coach
            </div>
            <p className="text-foreground">{m.feedback}</p>
            <div className="flex gap-3 mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>
                Conf <strong className="text-primary">{formatScore(m.confidence)}</strong>
              </span>
              <span>
                Clarity <strong className="text-primary">{formatScore(m.clarity)}</strong>
              </span>
              <span>
                Fillers <strong className="text-primary">{m.fillerWords ?? 0}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{value == null ? "—" : Math.round(v)}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value == null ? 0 : v}%` }}
          transition={{ duration: 0.6 }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
}

function FinishedReport({
  session,
  onRestart,
}: {
  session: PitchSessionDetail;
  onRestart: () => void;
}) {
  const mistakes = session.mistakes ?? [];
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="border-primary/40 overflow-hidden">
          <div className="bg-secondary text-secondary-foreground px-6 py-5 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="font-mono text-xs uppercase tracking-widest text-primary">
                Session report
              </div>
              <p className="text-sm text-secondary-foreground/80">
                {session.summary}
              </p>
            </div>
            <div className="font-display text-4xl text-primary">
              {formatScore(session.overallScore)}
            </div>
          </div>
          <CardContent className="p-6">
            {mistakes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No major mistakes flagged. Run another session to keep the
                muscle memory sharp.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Mistake analysis ({mistakes.length})
                </div>
                <div className="space-y-3">
                  {mistakes.map((m, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-4 ${
                        m.severity === "high"
                          ? "border-destructive/40 bg-destructive/5"
                          : m.severity === "medium"
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold flex items-center gap-2">
                          {m.severity === "high" ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Flame className="h-4 w-4 text-primary" />
                          )}
                          {m.title}
                        </div>
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] ${
                            m.severity === "high"
                              ? "border-destructive text-destructive"
                              : ""
                          }`}
                        >
                          {m.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {m.description}
                      </p>
                      {m.suggestion && (
                        <div className="mt-3 text-sm border-l-2 border-primary pl-3">
                          <span className="font-semibold text-primary">Fix: </span>
                          {m.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="mt-6 flex gap-2">
              <Button onClick={onRestart}>
                <Mic className="h-4 w-4 mr-2" /> Run it back
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
