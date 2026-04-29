import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Logo";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) setLocation("/dashboard");
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="md:w-1/2 relative overflow-hidden bg-secondary text-secondary-foreground p-10 md:p-16 flex flex-col justify-between">
        <div className="absolute inset-0 pm-grid-bg opacity-30 pointer-events-none" />
        <motion.div
          aria-hidden
          className="absolute -top-32 -left-32 h-[500px] w-[500px] pm-aurora pointer-events-none"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <div className="relative">
          <Wordmark />
        </div>
        <div className="relative space-y-6">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Welcome back, founder
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight leading-tight pm-text-balance">
            The arena is warm.
            <br />
            The investor is waiting.
          </h1>
          <p className="text-secondary-foreground/70 text-lg max-w-md">
            Pick up where you left off — or start a new idea and run it
            through the full loop in under five minutes.
          </p>
        </div>
        <div className="relative text-xs text-secondary-foreground/50 font-mono">
          v0.1 · founder build
        </div>
      </div>
      <div className="md:w-1/2 flex items-center justify-center p-10 bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Sign in to continue
            </h2>
            <p className="mt-2 text-muted-foreground">
              One click. No password to remember.
            </p>
          </div>
          <Button
            size="lg"
            className="w-full h-12 text-base gap-2"
            onClick={() => login()}
            disabled={isLoading}
            data-testid="login-button"
          >
            Log in to PitchMind <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            By continuing you agree to be intellectually honest with yourself
            about your pitch.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
