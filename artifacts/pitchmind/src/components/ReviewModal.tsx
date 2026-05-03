import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

interface ReviewModalProps {
  sessionId: string;
  onClose: () => void;
  onReviewed: () => void;
}

export function ReviewModal({ sessionId, onClose, onReviewed }: ReviewModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const apiBase = `${BASE_URL}/api`.replace("//api", "/api");

  const submit = async () => {
    if (rating === 0 || description.trim().length < 10) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, description: description.trim(), sessionId }),
      });
      if (!res.ok && res.status !== 409) throw new Error("Failed");
      setDone(true);
      onReviewed();
      setTimeout(onClose, 2000);
    } catch {
      toast({ title: "Couldn't save your review", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-7"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-8 text-center gap-3"
              >
                <div className="text-5xl">🎉</div>
                <h3 className="font-display text-xl font-semibold">Thanks for your review!</h3>
                <p className="text-sm text-muted-foreground">
                  Your feedback helps other student founders find PitchMind.
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }}>
                <div className="font-mono text-xs uppercase tracking-widest text-primary mb-1">
                  Session complete
                </div>
                <h3 className="font-display text-xl font-semibold mb-1">
                  How was your pitch session?
                </h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Takes 30 seconds. Helps the next founder who finds this app.
                </p>

                <div className="flex items-center gap-1.5 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= (hovered || rating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                    </span>
                  )}
                </div>

                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What helped you most? What would you tell another student founder about PitchMind?"
                  rows={3}
                  className="resize-none text-sm mb-1"
                  maxLength={600}
                />
                <p className="text-xs text-muted-foreground mb-4">
                  {description.trim().length < 10
                    ? `${10 - description.trim().length} more characters needed`
                    : `${description.trim().length} / 600`}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={onClose}
                  >
                    Maybe later
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={submit}
                    disabled={rating === 0 || description.trim().length < 10 || submitting}
                  >
                    {submitting ? "Submitting…" : "Submit review"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
