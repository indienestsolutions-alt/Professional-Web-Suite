import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-5">
        <Wordmark />
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            404 — off the map
          </div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl font-semibold tracking-tight">
            Wrong door, founder.
          </h1>
          <p className="mt-4 text-muted-foreground">
            The page you tried doesn't exist. The arena is still right where
            you left it.
          </p>
          <Link href="/dashboard">
            <Button className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
