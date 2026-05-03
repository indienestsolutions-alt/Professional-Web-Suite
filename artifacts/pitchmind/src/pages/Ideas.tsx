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
import { motion } from "framer-motion";
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
        toast({
          title: "Could not save idea",
          variant: "destructive",
        }),
    },
  });

  const remove = useDeleteIdea({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListIdeasQueryKey() }),
    },
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <>
            <Lightbulb className="h-3.5 w-3.5" /> Idea bench
          </>
        }
        title="Your ideas"
        description="The raw thoughts. The structured plans. The decks. All of them, in one place."
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
                      rawText.trim().split(/\s+/).filter(Boolean).length >= 150
                        ? "text-emerald-600"
                        : "text-muted-foreground"
                    }`}>
                      {rawText.trim().split(/\s+/).filter(Boolean).length} / 150 words min
                    </span>
                  </div>
                  <Textarea
                    id="raw"
                    rows={8}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Describe your idea in detail — minimum 150 words.\n\nCover:\n• What problem does it solve, and who faces it?\n• What exactly does your product do?\n• Who will pay for it and why?\n• What makes you different from existing solutions?\n\nThe more detail you give, the sharper the AI analysis will be.`}
                    className="mt-0 resize-none"
                    data-testid="input-idea-raw"
                  />
                  {rawText.trim().split(/\s+/).filter(Boolean).length < 150 && rawText.length > 10 && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      Add {150 - rawText.trim().split(/\s+/).filter(Boolean).length} more words — the AI needs enough detail to give you real feedback.
                    </p>
                  )}
                  {rawText.trim().split(/\s+/).filter(Boolean).length >= 150 && (
                    <p className="text-xs text-emerald-600 mt-1.5">
                      ✓ Good detail — the AI can work with this.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    create.mutate({
                      data: { title: title.trim(), rawText: rawText.trim() },
                    })
                  }
                  disabled={
                    create.isPending ||
                    title.trim().length === 0 ||
                    rawText.trim().split(/\s+/).filter(Boolean).length < 150
                  }
                  data-testid="submit-idea"
                >
                  {create.isPending ? "Saving..." : "Save idea"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {ideas.isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (ideas.data ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 px-6 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 pm-aurora opacity-50 blur-2xl -z-10" />
              <div className="h-16 w-16 rounded-2xl bg-foreground text-background flex items-center justify-center">
                <Lightbulb className="h-7 w-7" />
              </div>
            </div>
            <h2 className="font-display text-2xl font-semibold">
              Your bench is empty.
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md">
              Drop your first idea — even the half-formed one. The structure
              comes after.
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
                          {idea.status === "deck_generated" && (
                            <Presentation className="h-3 w-3 mr-1" />
                          )}
                          {idea.status === "structured" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {idea.status === "draft" && (
                            <FileText className="h-3 w-3 mr-1" />
                          )}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (confirm(`Delete "${idea.title}"?`)) {
                            remove.mutate({ id: idea.id });
                          }
                        }}
                        data-testid={`delete-idea-${idea.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Link href={`/ideas/${idea.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Open <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
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
