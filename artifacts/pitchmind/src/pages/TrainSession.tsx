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
  Keyboard,
  AlertCircle,
  List,
  X,
  Paperclip,
  FileText,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { ReviewModal } from "@/components/ReviewModal";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "中文" },
  { code: "ar", label: "عربي" },
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
  const [showQuestions, setShowQuestions] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      const key = `pm_reviewed_${id}`;
      if (!localStorage.getItem(key)) {
        const timer = setTimeout(() => setShowReview(true), 1200);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [sessionQ.data?.status, id]);

  const audioUnlockedRef = useRef(false);
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current || !audioPlayerRef.current) return;
    audioPlayerRef.current.src =
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    audioPlayerRef.current.play().then(() => {
      audioPlayerRef.current?.pause();
      audioUnlockedRef.current = true;
    }).catch(() => {});
  }, []);

  const playAudio = useCallback((base64: string) => {
    if (!voiceEnabled || !base64) return;
    try {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      const el = audioPlayerRef.current;
      if (!el) return;
      el.pause();
      el.src = url;
      el.play().catch((err) => {
        if ((err as DOMException).name === "NotAllowedError") {
          setTimeout(() => el.play().catch(() => {}), 300);
        }
      });
    } catch {}
  }, [voiceEnabled]);

  const apiBase = `${BASE_URL}/api`.replace("//api", "/api");

  const sendText = useCallback(async (content: string) => {
    if (!content.trim()) return;
    setIsSendingText(true);
    try {
      const res = await fetch(`${apiBase}/sessions/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content.trim(), language }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Send failed");
      }
      const data = await res.json() as { investorAudio?: string; autoFinished?: boolean } & PitchSessionDetail;
      if (data.investorAudio) playAudio(data.investorAudio);
      if (data.autoFinished) {
        toast({ title: "Session complete", description: "The investor has made their decision." });
        qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      }
      qc.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
      setDraft("");
    } catch (err) {
      toast({ title: "Could not send", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setIsSendingText(false);
    }
  }, [id, language, apiBase, playAudio, toast, qc]);

  const sendVoiceBlob = useCallback(async (blob: Blob) => {
    if (blob.size === 0) return;
    setIsSendingVoice(true);
    try {
      const base64 = arrayBufferToBase64(await blob.arrayBuffer());
      const res = await fetch(`${apiBase}/sessions/${id}/voice-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ audio: base64, language }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Voice processing failed");
      }
      const data = await res.json() as { transcript: string; investorAudio: string; autoFinished?: boolean } & PitchSessionDetail;
      if (data.investorAudio) playAudio(data.investorAudio);
      if (data.autoFinished) {
        toast({ title: "Session complete", description: "The investor has made their decision." });
        qc.invalidateQueries({ queryKey: getListSessionsQueryKey() });
      }
      qc.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
    } catch (err) {
      toast({ title: "Voice error", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setIsSendingVoice(false);
    }
  }, [id, language, apiBase, playAudio, toast, qc]);

  const stopRecording = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    setIsRecording(false);
    const blob = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(audioChunksRef.current, { type: recorder.mimeType ?? "audio/webm" }));
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });
    blob.then(sendVoiceBlob);
  }, [sendVoiceBlob]);

  const startRecording = useCallback(async () => {
    unlockAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(
        (t) => MediaRecorder.isTypeSupported(t)
      ) ?? "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const check = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
        analyser.getByteTimeDomainData(data);
        const rms = Math.sqrt(data.reduce((s, v) => s + (v - 128) ** 2, 0) / data.length);
        if (rms < 6) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              silenceTimerRef.current = null;
              stopRecording();
              ctx.close();
            }, 2500);
          }
        } else {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        }
        animFrameRef.current = requestAnimationFrame(check);
      };
      animFrameRef.current = requestAnimationFrame(check);
    } catch {
      toast({ title: "Microphone denied", description: "Please allow microphone access.", variant: "destructive" });
    }
  }, [toast, stopRecording, unlockAudio]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 5 MB.", variant: "destructive" });
      return;
    }
    setUploadingDoc(true);
    try {
      const base64 = arrayBufferToBase64(await file.arrayBuffer());
      const res = await fetch(`${apiBase}/sessions/${id}/upload-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fileBase64: base64, filename: file.name }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Upload failed");
      }
      toast({ title: "Document uploaded", description: `${file.name} — the investor will reference this.` });
      qc.invalidateQueries({ queryKey: getGetSessionQueryKey(id) });
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [id, apiBase, toast, qc]);

  if (sessionQ.isLoading) {
    return (
      <div className="flex flex-col h-dvh overflow-hidden bg-background">
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
  const personaInitial = (session.personaName ?? "?")[0]?.toUpperCase() ?? "?";
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0]!;

  const investorQuestions = (session.messages ?? [])
    .filter((m) => m.role === "investor")
    .map((m, i) => ({ index: i + 1, content: m.content }));

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">
      <audio ref={audioPlayerRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".txt,.pdf,.doc,.docx,.md,.csv"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
      />

      {showReview && (
        <ReviewModal
          sessionId={id}
          onReviewed={() => localStorage.setItem(`pm_reviewed_${id}`, "1")}
          onClose={() => setShowReview(false)}
        />
      )}

      {/* Questions panel backdrop */}
      <AnimatePresence>
        {showQuestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowQuestions(false)}
          />
        )}
      </AnimatePresence>

      {/* Questions panel */}
      <AnimatePresence>
        {showQuestions && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[90vw] bg-card border-l border-border flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div>
                <p className="font-semibold text-sm">Questions asked</p>
                <p className="text-xs text-muted-foreground">{investorQuestions.length} total</p>
              </div>
              <button
                onClick={() => setShowQuestions(false)}
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {investorQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No questions yet.</p>
              ) : (
                investorQuestions.map((q) => (
                  <div key={q.index} className="rounded-lg bg-muted/60 p-3">
                    <span className="font-mono text-[10px] text-primary tracking-widest">
                      Q{String(q.index).padStart(2, "0")}
                    </span>
                    <p className="text-sm mt-1 leading-relaxed">{q.content}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language picker dropdown */}
      <AnimatePresence>
        {showLangMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setShowLangMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              className="fixed top-14 right-24 z-40 bg-card border border-border rounded-xl shadow-xl p-1 min-w-[160px]"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    l.code === language
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card px-3 py-2.5 flex items-center gap-2 min-w-0">
        <Link href="/train">
          <a className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Link>

        <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
          {personaInitial}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            {session.personaName ?? session.personaSlug}
          </p>
          <p className="text-xs text-muted-foreground truncate">{session.ideaTitle ?? "Pitch session"}</p>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          {/* Language selector */}
          <button
            onClick={() => setShowLangMenu((v) => !v)}
            className="h-8 flex items-center gap-1.5 px-2 rounded-md hover:bg-muted text-muted-foreground transition-colors border border-border/60 text-xs font-mono"
            title="Response language"
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            {currentLang.code.toUpperCase()}
          </button>

          {/* Questions */}
          <button
            onClick={() => setShowQuestions(true)}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors relative"
            title="View all questions"
          >
            <List className="h-4 w-4" />
            {investorQuestions.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[8px] text-white flex items-center justify-center font-bold">
                {investorQuestions.length}
              </span>
            )}
          </button>

          {/* Voice toggle */}
          <button
            onClick={() => setVoiceEnabled((v) => !v)}
            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
            title={voiceEnabled ? "Mute investor voice" : "Unmute investor voice"}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {!finished ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => finish.mutate({ id })}
              disabled={finish.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              {finish.isPending ? "Scoring…" : "End"}
            </Button>
          ) : (
            <Badge variant="default" className="font-mono text-[10px]">
              <Trophy className="h-3 w-3 mr-1" />DONE
            </Badge>
          )}
        </div>
      </header>

      {/* Live score bar */}
      {(session.confidenceScore != null || session.clarityScore != null) && (
        <div className="shrink-0 border-b border-border/50 bg-muted/30 px-4 py-1.5 flex gap-4 overflow-x-auto">
          <ScorePill label="Confidence" value={session.confidenceScore ?? null} />
          <ScorePill label="Clarity" value={session.clarityScore ?? null} />
          <ScorePill label="Readiness" value={session.investorReadiness ?? null} />
          {session.overallScore != null && (
            <ScorePill label="Overall" value={session.overallScore} highlight />
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={transcriptRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2 min-h-0">
        {(session.messages ?? []).map((m) => (
          <ChatMessage key={m.id} m={m} personaName={session.personaName ?? "Investor"} />
        ))}

        {isBusy && (
          <div className="flex justify-start pl-2">
            <div className="flex items-center gap-2 bg-muted rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
              {isRecording ? "Listening…" : isSendingVoice ? "Processing voice…" : "Thinking…"}
            </div>
          </div>
        )}

        {uploadingDoc && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 animate-spin text-primary" />
              Uploading document…
            </div>
          </div>
        )}

        {finished && (
          <SessionReport
            session={session}
            investorQuestions={investorQuestions}
            onNewSession={() => setLocation("/train/new")}
          />
        )}
      </div>

      {/* Input */}
      {!finished && (
        <div className="shrink-0 border-t border-border bg-card">
          <AnimatePresence mode="wait">
            {inputMode === "voice" ? (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-4 py-4"
              >
                {/* Record button */}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isSendingVoice || isSendingText}
                  className={`relative h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    isRecording
                      ? "bg-destructive text-white scale-110"
                      : isSendingVoice
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-white hover:scale-105 active:scale-95"
                  }`}
                >
                  {isSendingVoice ? (
                    <Sparkles className="h-6 w-6 animate-spin" />
                  ) : isRecording ? (
                    <>
                      <span className="absolute inset-0 rounded-full bg-destructive/30 animate-ping" />
                      <MicOff className="h-6 w-6 relative" />
                    </>
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {isRecording ? "Listening… tap to stop" : isSendingVoice ? "Processing…" : "Tap to speak"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRecording ? "Sends after 2.5s of silence" : "Auto-sends when you stop talking"}
                  </p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="h-9 w-9 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  title="Upload a document"
                >
                  <Paperclip className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setInputMode("text")}
                  className="h-9 w-9 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                  title="Switch to typing"
                >
                  <Keyboard className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 flex gap-2 items-end"
              >
                <button
                  onClick={() => setInputMode("voice")}
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0 mb-0.5"
                  title="Switch to voice"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  placeholder="Type your answer… (Ctrl+Enter to send)"
                  className="resize-none text-sm flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) sendText(draft);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDoc}
                  className="h-10 w-10 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 mb-0.5"
                  title="Upload a document"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <Button
                  onClick={() => sendText(draft)}
                  disabled={isSendingText || !draft.trim()}
                  size="icon"
                  className="h-10 w-10 rounded-full shrink-0 mb-0.5"
                >
                  {isSendingText
                    ? <Sparkles className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ScorePill({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) {
  return (
    <div className="flex items-baseline gap-1 shrink-0">
      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`font-mono text-xs font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>
        {value == null ? "—" : Math.round(value)}
      </span>
    </div>
  );
}

function ChatMessage({ m, personaName }: { m: SessionMessage; personaName: string }) {
  if (m.role === "system") {
    if (m.content.startsWith("[Document uploaded:")) {
      const filename = m.content.split("\n")[0]?.replace("[Document uploaded: ", "").replace("]", "") ?? "";
      return (
        <div className="flex justify-center my-1">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
            <FileText className="h-3 w-3" />
            {filename} uploaded
          </span>
        </div>
      );
    }
    return (
      <div className="flex justify-center my-1">
        <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full text-center max-w-xs">
          {m.content}
        </span>
      </div>
    );
  }

  const isUser = m.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold mt-0.5 ${
        isUser ? "bg-foreground text-background" : "bg-primary/15 text-primary"
      }`}>
        {isUser ? "Y" : personaName[0]?.toUpperCase()}
      </div>

      <div className={`flex flex-col gap-1 max-w-[78%] min-w-0 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-foreground text-background rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        }`}>
          {m.content}
        </div>

        {isUser && m.feedback && (
          <div className="flex items-start gap-1.5 px-1 max-w-full">
            <div className={`h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 ${
              (m.confidence ?? 0) > 78 ? "bg-emerald-500" : (m.confidence ?? 0) > 60 ? "bg-amber-400" : "bg-destructive"
            }`} />
            <p className="text-[11px] text-muted-foreground leading-relaxed">{m.feedback}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SessionReport({
  session,
  investorQuestions,
  onNewSession,
}: {
  session: PitchSessionDetail;
  investorQuestions: { index: number; content: string }[];
  onNewSession: () => void;
}) {
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  const scoreColor = (v: number) =>
    v >= 75 ? "text-emerald-500" : v >= 55 ? "text-amber-500" : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-1 mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Session complete</span>
        {session.overallScore != null && (
          <span className={`ml-auto font-mono text-2xl font-bold ${scoreColor(session.overallScore)}`}>
            {Math.round(session.overallScore)}
            <span className="text-xs text-muted-foreground font-normal">/100</span>
          </span>
        )}
      </div>

      {/* Score breakdown */}
      {(session.confidenceScore != null || session.clarityScore != null || session.investorReadiness != null) && (
        <div className="grid grid-cols-3 gap-2">
          {session.confidenceScore != null && <ScoreBlock label="Confidence" value={Math.round(session.confidenceScore)} />}
          {session.clarityScore != null && <ScoreBlock label="Clarity" value={Math.round(session.clarityScore)} />}
          {session.investorReadiness != null && <ScoreBlock label="Readiness" value={Math.round(session.investorReadiness)} />}
        </div>
      )}

      {/* AI verdict */}
      {session.summary && (
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">Investor verdict</p>
          <p className="text-sm text-foreground leading-relaxed">{session.summary}</p>
        </div>
      )}

      {/* Mistakes */}
      {(session.mistakes as { title: string; description: string; suggestion: string; severity: string }[] ?? []).length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">What to fix</p>
          {(session.mistakes as { title: string; description: string; suggestion: string; severity: string }[]).map((m, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className={`h-3.5 w-3.5 shrink-0 ${m.severity === "high" ? "text-destructive" : "text-amber-500"}`} />
                <span className="text-sm font-medium">{m.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{m.description}</p>
              <p className="text-xs text-primary mt-1">Fix: {m.suggestion}</p>
            </div>
          ))}
        </div>
      )}

      {/* Questions */}
      {investorQuestions.length > 0 && (
        <div>
          <button
            onClick={() => setShowAllQuestions((v) => !v)}
            className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors w-full text-left"
          >
            <List className="h-3.5 w-3.5" />
            {showAllQuestions ? "Hide" : "Show"} {investorQuestions.length} questions asked
          </button>
          <AnimatePresence>
            {showAllQuestions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5">
                  {investorQuestions.map((q) => (
                    <div key={q.index} className="rounded-lg bg-muted/60 px-3 py-2 flex gap-2 items-start">
                      <span className="font-mono text-[10px] text-primary tracking-widest shrink-0 mt-0.5">
                        Q{String(q.index).padStart(2, "0")}
                      </span>
                      <p className="text-xs leading-relaxed">{q.content}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <Button size="sm" onClick={onNewSession} className="w-full">
        Start another session
      </Button>
    </motion.div>
  );
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "text-emerald-500" : value >= 55 ? "text-amber-500" : "text-destructive";
  const bg = value >= 75 ? "bg-emerald-500/10" : value >= 55 ? "bg-amber-500/10" : "bg-destructive/10";
  return (
    <div className={`rounded-lg ${bg} p-2.5 text-center`}>
      <div className={`font-mono text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}
