import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListIdeas,
  useCreateIdea,
  useDeleteIdea,
  getListIdeasQueryKey,
} from "@workspace/api-client-react";
import { PageContainer, PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Lightbulb,
  Trash2,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileText,
  Presentation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatRelative, ideaStatusLabel } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

export default function IdeasPage() {
  const ideas = useListIdeas({ query: { queryKey: getListIdeasQueryKey() } });
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const create = useCreateIdea({
    mutation: {
      onSuccess: (idea) => {
        qc.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        setOpen(false);
        setTitle("");
        setRawText("");
        toast({ title: "Idea saved", description: "Now let's structure it." });
        setLocation(`/ideas/${idea.id}`);
      },
      onError: () =>
        toast({ title: "Could not save idea", variant: "destructive" }),
    },
  });

  const remove = useDeleteIdea({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListIdeasQueryKey() });
        setConfirmDeleteId(null);
        setDeletingId(null);
        toast({ title: "Idea deleted" });
      },
      onError: () => {
        setDeletingId(null);
        toast({ title: "Could not delete idea", variant: "destructive" });
      },
    },
  });

  const handleDelete = (id: string) => {
    setDeletingId(id);
    remove.mutate({ id });
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<><Lightbulb className="h-3.5 w-3.5" /> Idea bench</>}
        title="Your ideas"
        description="The raw thoughts. The structured plans. The decks."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-idea-button">
                <Plus className="h-4 w-4 mr-2" /> New idea
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Drop a new idea</DialogTitle>
                <DialogDescription>
                  Don't make it pretty. Make it real. We'll structure it next.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Working title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Loop — peer mentor matching for college freshmen"
                    className="mt-1.5"
                    data-testid="input-idea-title"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="raw">Describe your idea</Label>
                    <span className={`text-xs font-mono ${
                      rawText.trim().length >= 150 ? "text-emerald-600" : "text-muted-foreground"
                    }`}>
                      {rawText.trim().length} / 150
                    </span>
                  </div>
                  <Textarea
                    id="raw"
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="What problem does it solve? Who has it? What does your product do, and why can't they just use something that already exists?"
                    className="resize-none"
                    data-testid="input-idea-raw"
                  />
                  {rawText.trim().length > 10 && rawText.trim().length < 150 && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      {150 - rawText.trim().length} more characters needed.
                    </p>
                  )}
                  {rawText.trim().length >= 150 && (
                    <p className="text-xs text-emerald-600 mt-1.5">
                      Good — the AI has enough to work with.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => create.mutate({ data: { title: title.trim(), rawText: rawText.trim() } })}
                  disabled={create.isPending || !title.trim() || rawText.trim().length < 150}
                  data-testid="submit-idea"
                >
                  {create.isPending ? "Saving…" : "Save idea"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {ideas.isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : (ideas.data ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 px-6 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-foreground text-background flex items-center justify-center mb-6">
              <Lightbulb className="h-7 w-7" />
            </div>
            <h2 className="font-display text-2xl font-semibold">Your bench is empty.</h2>
            <p className="mt-2 text-muted-foreground max-w-md">
              Drop your first idea — even the half-formed one. The structure comes after.
            </p>
            <Button className="mt-6" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add your first idea
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.data!.map((idea, i) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative"
            >
              <Card className="group h-full hover:border-foreground/20 transition-colors overflow-hidden">
                <CardContent className="p-0">
                  <Link href={`/ideas/${idea.id}`}>
                    <a className="block p-5">
                      <div className="flex items-start justify-between gap-2">
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] tracking-widest ${
                            idea.status === "deck_generated"
                              ? "border-primary text-primary"
                              : idea.status === "structured"
                                ? "border-accent text-accent"
                                : ""
                          }`}
                        >
                          {idea.status === "deck_generated" && <Presentation className="h-3 w-3 mr-1" />}
                          {idea.status === "structured" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {idea.status === "draft" && <FileText className="h-3 w-3 mr-1" />}
                          {ideaStatusLabel(idea.status).toUpperCase()}
                        </Badge>
                        {idea.validationScore != null && (
                          <Badge variant="secondary" className="font-mono">
                            {Math.round(idea.validationScore)}
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-3 font-display text-lg font-semibold leading-snug line-clamp-2">
                        {idea.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {idea.problem ?? idea.rawText}
                      </p>
                    </a>
                  </Link>

                  <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                    <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      {formatRelative(idea.updatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Inline delete confirmation */}
                      <AnimatePresence mode="wait">
                        {confirmDeleteId === idea.id ? (
                          <motion.div
                            key="confirm"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/30 rounded-md px-2 py-1 text-xs"
                          >
                            <span className="text-destructive font-medium">Delete?</span>
                            <button
                              onClick={(e) => { e.preventDefault(); handleDelete(idea.id); }}
                              disabled={deletingId === idea.id}
                              className="font-semibold text-destructive hover:underline disabled:opacity-50"
                            >
                              {deletingId === idea.id ? "…" : "Yes"}
                            </button>
                            <button
                              onClick={(e) => { e.preventDefault(); setConfirmDeleteId(null); }}
                              className="text-muted-foreground hover:underline"
                            >
                              No
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(idea.id); }}
                              data-testid={`delete-idea-${idea.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Link href={`/ideas/${idea.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs">
                                Open <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
