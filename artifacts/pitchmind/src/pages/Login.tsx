import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LoginPage() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/sign-in", { replace: true });
  }, [setLocation]);

  return null;
}
