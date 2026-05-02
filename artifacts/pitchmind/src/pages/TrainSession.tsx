import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSession,
  useFinishSession,
  getGetSessionQueryKey,
  getListSessionsQueryKey,
} from "@workspace/api-client-react";
import type { PitchSessionDetail, SessionMessage } from "@workspace/api-client-react";
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
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Trash2,
  AlertTriangle,
  Flame,
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
  const [, setLocation] = useLocation();
  const sessionQ = useGetSession(id, {
    query: { enabled: !!id, queryKey: getGetSessionQueryKey(id) },
  });
  const [draft, setDraft] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [language, setLanguage] = useState("en");
  const [inputMode, setInputMode] = useState<InputMode>("voice");
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const playAudio = useCallback((base64: string) => {
    if (!voiceEnabled || !base64) return;
    try {
      const audioBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([audioBytes], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = url;
        audioPlayerRef.current.play().catch(() => {});
      }
    } catch {}
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
      if (data.autoFinished) {
        toast({ title: "You're investor-ready!", description: "The investor has seen enough — you're ready for the real room." });
        qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      }
      qc.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
      setDraft("");
    } catch (err: unknown) {
      toast({ title: "Could not send", description: err instanceof Error ? err.message : "Send failed", variant: "destructive" });
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
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
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
      recorder.onstop = () => resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType ?? "audio/webm" }));
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });
    if (blob.size === 0) {
      setIsSendingVoice(false);
      toast({ title: "No audio recorded", description: "Try again and speak clearly.", variant: "destructive" });
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
      const data = await response.json() as { transcript: string; investorAudio: string; autoFinished?: boolean } & PitchSessionDetail;
      if (data.transcript) {
        toast({ title: "Heard:", description: `"${data.transcript.slice(0, 80)}${data.transcript.length > 80 ? "…" : ""}"` });
      }
      if (data.investorAudio) playAudio(data.investorAudio);
      if (data.autoFinished) {
        toast({ title: "You're investor-ready!", description: "The investor has seen enough — you're ready for the real room." });
        qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      }
      qc.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
    } catch (err: unknown) {
      toast({ title: "Voice error", description: err instanceof Error ? err.message : "Voice failed", variant: "destructive" });
    } finally {
      setIsSendingVoice(false);
    }
  }, [id, language, apiBase, playAudio, toast, qc]);

  const deleteSession = useCallback(async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${apiBase}/sessions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Delete failed");
      qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      setLocation("/train");
    } catch {
      toast({ title: "Could not delete session", variant: "destructive" });
      setIsDeleting(false);
    }
  }, [id, apiBase, qc, setLocation, toast]);

  if (sessionQ.isLoading) {
    return (
      <div className="flex flex-col h-[calc(100dvh-48px)] md:h-screen overflow-hidden bg-background">
        <div className="p-4 border-b flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const session = sessionQ.data;
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Session not found.
      </div>
    );
  }

  const finished = session.status === "finished";
  const isBusy = isRecording || isSendingVoice || isSendingText;

  return (
    <div className="flex flex-col h-[calc(100dvh-48px)] md:h-screen overflow-hidden bg-background">
      <audio ref={audioPlayerRef} className="hidden" />

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-border bg-card px-3 md:px-5 py-3 flex items-center gap-3 min-w-0">
        <Link href="/train">
          <a className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-sm truncate">
              {session.personaName ?? session.personaSlug}
            </span>
            <Badge
              variant={finished ? "default" : "secondary"}
              className="font-mono text-[10px] shrink-0"
            >
              {finished ? <><Trophy className="h-2.5 w-2.5 mr-1" />DONE</> : <><Flame className="h-2.5 w-2.5 mr-1" />LIVE</>}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {session.ideaTitle ?? "Pitch session"}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          {!finished && (
            <>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="hidden sm:block text-xs border border-border rounded-md px-2 py-1.5 bg-background text-foreground"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVoiceEnabled((v) => !v)}
                title={voiceEnabled ? "Mute investor voice" : "Turn on investor voice"}
              >
                {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => finish.mutate({ id })}
                disabled={finish.isPending}
                className="hidden sm:flex"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                {finish.isPending ? "Finishing…" : "End session"}
              </Button>
              <Button
                size="sm"
                onClick={() => finish.mutate({ id })}
                disabled={finish.isPending}
                className="sm:hidden h-8 w-8 p-0"
                variant="outline"
                title="End session"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </>
          )}
          {!showDeleteConfirm ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete session"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/30 rounded-md px-2 py-1">
              <span className="text-xs text-destructive font-medium">Delete?</span>
              <button
                onClick={deleteSession}
                disabled={isDeleting}
                className="text-xs font-semibold text-destructive hover:underline disabled:opacity-50"
              >
                {isDeleting ? "…" : "Yes"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs text-muted-foreground hover:underline"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Score strip ── */}
      <div className="shrink-0 border-b border-border bg-background px-3 md:px-5 py-2 flex items-center gap-4 md:gap-6 overflow-x-auto">
        <ScorePill label="Confidence" value={session.confidenceScore ?? null} />
        <ScorePill label="Clarity" value={session.clarityScore ?? null} />
        <ScorePill label="Readiness" value={session.investorReadiness ?? null} />
        {session.overallScore != null && (
          <>
            <div className="h-4 w-px bg-border shrink-0" />
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Overall</span>
              <span className="font-display text-lg font-semibold text-primary">{Math.round(session.overallScore)}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Transcript ── */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-y-auto px-3 md:px-5 py-4 space-y-3"
      >
        {(session.messages ?? []).map((m) => (
          <Message key={m.id} m={m} />
        ))}

        {isBusy && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
              {isSendingVoice ? "Listening and thinking…" : "Thinking…"}
            </div>
          </div>
        )}

        {finished && session.summary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4"
          >
            <div className="font-mono text-xs uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
              <Trophy className="h-3.5 w-3.5" /> Session report
            </div>
            <p className="text-sm text-foreground">{session.summary}</p>
            {(session.mistakes as any[] ?? []).length > 0 && (
              <div className="mt-3 space-y-2">
                {(session.mistakes as any[]).map((m: any, i: number) => (
                  <div key={i} className="rounded-md border border-border bg-card p-3 text-xs">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <AlertTriangle className={`h-3 w-3 ${m.severity === "high" ? "text-destructive" : "text-amber-500"}`} />
                      {m.title}
                    </div>
                    <p className="text-muted-foreground mt-1">{m.description}</p>
                    <p className="text-primary mt-1">→ {m.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setLocation("/train/new")}
            >
              Start another session
            </Button>
          </motion.div>
        )}
      </div>

      {/* ── Input area ── */}
      {!finished && (
        <div className="shrink-0 border-t border-border bg-background">
          {/* Mode tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setInputMode("voice")}
              className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${
                inputMode === "voice"
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mic className="h-3 w-3" /> Voice
            </button>
            <button
              onClick={() => setInputMode("text")}
              className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${
                inputMode === "text"
                  ? "bg-primary/10 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Send className="h-3 w-3" /> Type
            </button>
          </div>

          <AnimatePresence mode="wait">
            {inputMode === "voice" ? (
              <motion.div
                key="voice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-5 px-4"
              >
                <p className="text-xs text-muted-foreground text-center">
                  {isRecording
                    ? "Speaking… tap to stop and send"
                    : isSendingVoice
                      ? "Processing your answer…"
                      : "Tap the mic, speak your answer, then tap again to send"}
                </p>
                <button
                  onClick={isRecording ? stopRecordingAndSend : startRecording}
                  disabled={isSendingVoice}
                  className={`relative h-16 w-16 rounded-full flex items-center justify-center transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    isRecording
                      ? "bg-destructive text-white scale-110"
                      : isSendingVoice
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-white hover:scale-105 active:scale-95"
                  }`}
                >
                  {isSendingVoice ? (
                    <Sparkles className="h-7 w-7 animate-spin" />
                  ) : isRecording ? (
                    <>
                      <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping" />
                      <MicOff className="h-7 w-7 relative" />
                    </>
                  ) : (
                    <Mic className="h-7 w-7" />
                  )}
                </button>
                {isRecording && (
                  <div className="flex items-center gap-2 text-xs text-destructive font-mono">
                    <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    Recording
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3"
              >
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder="Type your answer…"
                  className="resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) {
                      sendText(draft);
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Ctrl+Enter to send</span>
                  <Button
                    size="sm"
                    onClick={() => sendText(draft)}
                    disabled={isSendingText || !draft.trim()}
                  >
                    {isSendingText
                      ? <><Sparkles className="h-3.5 w-3.5 mr-1.5 animate-spin" />Sending…</>
                      : <><Send className="h-3.5 w-3.5 mr-1.5" />Send</>}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-baseline gap-1.5 shrink-0">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold text-foreground">
        {value == null ? "—" : Math.round(value)}
      </span>
    </div>
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
      <div className={`max-w-[85%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
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
              <Sparkles className="h-3 w-3" /> Coach
            </div>
            <p className="text-foreground">{m.feedback}</p>
            <div className="flex gap-3 mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>Conf <strong className="text-primary">{formatScore(m.confidence)}</strong></span>
              <span>Clarity <strong className="text-primary">{formatScore(m.clarity)}</strong></span>
              <span>Fillers <strong className="text-primary">{m.fillerWords ?? 0}</strong></span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
