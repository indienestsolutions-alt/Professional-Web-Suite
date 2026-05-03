import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import { Spinner } from "@/components/ui/spinner";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/sign-in");
    }
  }, [isSignedIn, isLoaded, setLocation]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  return <>{children}</>;
}
