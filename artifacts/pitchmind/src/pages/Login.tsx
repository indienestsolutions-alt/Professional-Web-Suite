import { useEffect } from "react";
import { useAuthContext } from "@/contexts/auth";

export default function LoginPage() {
  const { login } = useAuthContext();

  useEffect(() => {
    login();
  }, [login]);

  return null;
}
