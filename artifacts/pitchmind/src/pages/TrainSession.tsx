import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSession,
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
  MicOff,
  ArrowLeft,
  Send,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Sparkles,
  Trophy,
  XCircle,
  Languages,
  List,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatScore } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "hi", label: "हिंदी" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "العربية" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
];

type InputMode = "voice" | "text";

export default function TrainSessionPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const sessionQ = useGetSession(id, {
    query: { enabled: !!id, queryKey: getGetSessionQueryKey(id) },
  });
  const [draft, setDraft] = useState("");
  const [, setLocation] = useLocation();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState("en");
  const [showQList, setShowQList] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("voice");

  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    if (sessionQ.data?.status === "finished") {
      qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
    }
  }, [sessionQ.data?.status]);

  const playAudio = useCallback((base64: string) => {
    if (!voiceEnabled || !base64) return;
    try {
      const audioBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(audioBlob);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play().catch(() => {});
      }
    } catch {
    }
  }, [voiceEnabled]);

  const apiBase = `${BASE_URL}/api`.replace("//api", "/api");

  const sendText = useCallback(async (content: string) => {
    if (!content.trim()) return;
    setIsSendingText(true);
    try {
      const response = await fetch(`${apiBase}/sessions/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content.trim(), language }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Send failed");
      }
      const data = await response.json() as { investorAudio?: string; autoFinished?: boolean } & PitchSessionDetail;

      if (data.investorAudio) playAudio(data.investorAudio);

      qc.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
      if (data.autoFinished || data.status === "finished") {
        qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      }
      setDraft("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Send failed";
      toast({ title: "Could not send", description: msg, variant: "destructive" });
    } finally {
      setIsSendingText(false);
    }
  }, [id, language, apiBase, playAudio, toast, qc]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
      const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) ?? "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to use voice mode.", variant: "destructive" });
    }
  }, [toast]);

  const stopRecordingAndSend = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    setIsRecording(false);
    setIsSendingVoice(true);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType ?? "audio/webm" }));
      };
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });

    if (blob.size === 0) {
      setIsSendingVoice(false);
      toast({ title: "No audio recorded", description: "Try again and speak clearly into your microphone.", variant: "destructive" });
      return;
    }

    try {
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const response = await fetch(`${apiBase}/sessions/${id}/voice-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ audio: base64, language }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Voice processing failed");
      }

      const data = await response.json() as { transcript: string; investorAudio: string; autoFinished: boolean } & PitchSessionDetail;

      if (data.transcript) {
        toast({ title: "Heard you say:", description: `"${data.transcript.slice(0, 80)}${data.transcript.length > 80 ? "..." : ""}"` });
      }

      if (data.investorAudio) playAudio(data.investorAudio);

      qc.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
      if (data.autoFinished || data.status === "finished") {
        qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Voice failed";
      toast({ title: "Voice error", description: msg, variant: "destructive" });
    } finally {
      setIsSendingVoice(false);
    }
  }, [id, language, apiBase, playAudio, toast, qc]);

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
  const investorQuestions = (session.messages ?? []).filter((m) => m.role === "investor");
  const isBusy = isRecording || isSendingVoice || isSendingText;

  return (
    <PageContainer>
      <audio ref={audioPlayerRef} className="hidden" />

      <Link href="/train">
        <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> All sessions
        </a>
      </Link>

      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary inline-flex items-center gap-2">
            <Mic className="h-3.5 w-3.5" /> Practice session ·{" "}
            {finished ? "DONE" : "LIVE"}
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold mt-2 tracking-tight">
            Talking with {session.personaName ?? session.personaSlug}
          </h1>
          <p className="text-muted-foreground mt-1">
            Pitching:{" "}
            <Link href={`/ideas/${session.ideaId}`}>
              <a className="text-foreground hover:underline">{session.ideaTitle}</a>
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!finished && (
            <>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
                title="Language"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQList((v) => !v)}
                title="See questions asked so far"
              >
                <List className="h-3.5 w-3.5 mr-1" />
                {showQList ? "Hide" : "Questions"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVoiceEnabled((v) => !v)}
                title={voiceEnabled ? "Mute investor voice" : "Turn on investor voice"}
              >
                {voiceEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="outline"
                onClick={() => finish.mutate({ id })}
                disabled={finish.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {finish.isPending ? "Finishing..." : "End & get report"}
              </Button>
            </>
          )}
          {finished && (
            <Button variant="outline" size="sm" onClick={() => setShowQList((v) => !v)}>
              <List className="h-3.5 w-3.5 mr-1" />
              {showQList ? "Hide" : "Questions asked"}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showQList && investorQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <Card className="border-primary/30">
              <CardContent className="p-5">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <List className="h-3.5 w-3.5" />
                  Questions asked so far ({investorQuestions.length})
                </div>
                <ol className="space-y-2">
                  {investorQuestions.map((q, i) => (
                    <li key={q.id} className="flex gap-3 text-sm">
                      <span className="font-mono text-primary shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-foreground">{q.content}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {finished && (
        <FinishedReport session={session} onRestart={() => setLocation("/train/new")} />
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <Card className="overflow-hidden">
          <CardContent className="p-0 flex flex-col h-[620px]">
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 bg-card"
            >
              {(session.messages ?? []).map((m) => (
                <Message key={m.id} m={m} />
              ))}
              {isBusy && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                    {isSendingVoice ? "Listening and thinking..." : "Thinking..."}
                  </div>
                </div>
              )}
            </div>

            {!finished && (
              <div className="border-t border-border bg-background">
                <div className="flex border-b border-border">
                  <button
                    onClick={() => setInputMode("voice")}
                    className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${inputMode === "voice" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Mic className="h-3 w-3" /> Voice
                  </button>
                  <button
                    onClick={() => setInputMode("text")}
                    className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${inputMode === "text" ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Send className="h-3 w-3" /> Type
                  </button>
                </div>

                {inputMode === "voice" ? (
                  <div className="p-6 flex flex-col items-center gap-4">
                    <p className="text-xs text-muted-foreground text-center">
                      {isRecording
                        ? "Speaking... tap the button to stop and send"
                        : isSendingVoice
                          ? "Processing your answer..."
                          : "Tap the mic, speak your answer, then tap again to send"}
                    </p>
                    <button
                      onClick={isRecording ? stopRecordingAndSend : startRecording}
                      disabled={isSendingVoice}
                      className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        isRecording
                          ? "bg-destructive text-white scale-110"
                          : isSendingVoice
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "bg-primary text-white hover:scale-105 active:scale-95"
                      }`}
                    >
                      {isSendingVoice ? (
                        <Sparkles className="h-8 w-8 animate-spin" />
                      ) : isRecording ? (
                        <>
                          <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
                          <MicOff className="h-8 w-8 relative" />
                        </>
                      ) : (
                        <Mic className="h-8 w-8" />
                      )}
                    </button>
                    {isRecording && (
                      <div className="flex items-center gap-2 text-xs text-destructive font-mono">
                        <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        Recording now
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4">
                    <Textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      placeholder="Type your answer here..."
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) {
                          sendText(draft);
                        }
                      }}
                      data-testid="pitch-input"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">Ctrl/Cmd + Enter to send</span>
                      <Button
                        size="sm"
                        onClick={() => sendText(draft)}
                        disabled={isSendingText || !draft.trim()}
                        data-testid="send-pitch-button"
                      >
                        {isSendingText ? (
                          <><Sparkles className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Sending...</>
                        ) : (
                          <><Send className="h-3.5 w-3.5 mr-1.5" /> Send</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Your scores
              </div>
              <div className="mt-3 space-y-3">
                <Score label="Confidence" value={session.confidenceScore ?? null} />
                <Score label="Clarity" value={session.clarityScore ?? null} />
                <Score label="Investor ready" value={session.investorReadiness ?? null} />
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
                How this works
              </div>
              <p className="mt-3 text-sm text-foreground leading-relaxed">
                Answer each question out loud or by typing. The AI reads your actual pitch idea and asks questions based on it. After {7} questions, you'll get your full report.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {voiceEnabled ? (
                  <span className="flex items-center gap-1.5"><Volume2 className="h-3 w-3" /> Investor voice is on — you'll hear their questions.</span>
                ) : (
                  <span className="flex items-center gap-1.5"><VolumeX className="h-3 w-3" /> Investor voice is muted.</span>
                )}
              </p>
            </CardContent>
          </Card>

          {!finished && (
            <Card>
              <CardContent className="p-5">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Languages className="h-3.5 w-3.5" />
                  Language
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The AI will ask questions in:{" "}
                  <strong className="text-foreground">
                    {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label ?? language}
                  </strong>
                </p>
              </CardContent>
            </Card>
          )}
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
      <div className={`max-w-[82%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
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
              <Sparkles className="h-3 w-3" /> Coach feedback
            </div>
            <p className="text-foreground">{m.feedback}</p>
            <div className="flex gap-3 mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>Confidence <strong className="text-primary">{formatScore(m.confidence)}</strong></span>
              <span>Clarity <strong className="text-primary">{formatScore(m.clarity)}</strong></span>
              <span>Fillers <strong className="text-primary">{m.fillerWords ?? 0}</strong></span>
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
  const investorQuestions = (session.messages ?? []).filter((m) => m.role === "investor");

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Card className="border-primary/40 overflow-hidden">
          <div className="bg-secondary text-secondary-foreground px-6 py-5 flex items-center gap-4">
            <Trophy className="h-6 w-6 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs uppercase tracking-widest text-primary">Your report</div>
              <p className="text-sm text-secondary-foreground/80 mt-1">{session.summary}</p>
            </div>
            <div className="font-display text-5xl text-primary shrink-0">{formatScore(session.overallScore)}</div>
          </div>
          <CardContent className="p-6">
            {investorQuestions.length > 0 && (
              <div className="mb-6">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <List className="h-3.5 w-3.5" />
                  All questions you were asked ({investorQuestions.length})
                </div>
                <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                  {investorQuestions.map((q, i) => (
                    <div key={q.id} className="flex gap-3 text-sm">
                      <span className="font-mono text-primary shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-foreground">{q.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mistakes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No major issues found. Keep practicing to stay sharp.</p>
            ) : (
              <>
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  What to improve ({mistakes.length} thing{mistakes.length !== 1 ? "s" : ""})
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
                        <div className="font-semibold flex items-center gap-2 text-sm">
                          {m.severity === "high" ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <Flame className="h-4 w-4 text-primary" />
                          )}
                          {m.title}
                        </div>
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] ${m.severity === "high" ? "border-destructive text-destructive" : ""}`}
                        >
                          {m.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{m.description}</p>
                      {m.suggestion && (
                        <div className="mt-3 text-sm border-l-2 border-primary pl-3">
                          <span className="font-semibold text-primary">How to fix it: </span>
                          {m.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 flex gap-2 flex-wrap">
              <Button onClick={onRestart}>
                <Mic className="h-4 w-4 mr-2" /> Practice again
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
