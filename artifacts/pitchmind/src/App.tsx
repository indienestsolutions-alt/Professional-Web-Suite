import { useEffect, useRef } from "react";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  useClerk,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import LandingPage from "@/pages/Landing";
import DashboardPage from "@/pages/Dashboard";
import IdeasPage from "@/pages/Ideas";
import IdeaDetailPage from "@/pages/IdeaDetail";
import DeckViewerPage from "@/pages/DeckViewer";
import TrainPage from "@/pages/Train";
import TrainNewPage from "@/pages/TrainNew";
import TrainSessionPage from "@/pages/TrainSession";
import LearningPage from "@/pages/Learning";
import LearningTopicPage from "@/pages/LearningTopic";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// Only pass proxyUrl when it's a non-empty string — an empty string makes
// Clerk treat "" as the proxy base and fire requests that 404 in dev.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#FF5B04",
    colorForeground: "#1a1a1a",
    colorMutedForeground: "#6b7280",
    colorDanger: "#ef4444",
    colorBackground: "#FAF7F2",
    colorInput: "#ffffff",
    colorInputForeground: "#1a1a1a",
    colorNeutral: "#d1d5db",
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#FAF7F2] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[#e5e7eb]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-semibold text-[#1a1a1a]",
    headerSubtitle: "text-[#6b7280]",
    socialButtonsBlockButtonText: "text-[#1a1a1a] font-medium",
    formFieldLabel: "text-[#1a1a1a] text-sm font-medium",
    footerActionLink: "text-[#FF5B04] font-medium hover:text-[#e04f00]",
    footerActionText: "text-[#6b7280]",
    dividerText: "text-[#6b7280]",
    identityPreviewEditButton: "text-[#FF5B04]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-[#1a1a1a]",
    logoBox: "mb-2",
    logoImage: "h-9",
    socialButtonsBlockButton: "border border-[#d1d5db] bg-white hover:bg-[#f9f9f9] transition-colors",
    formButtonPrimary: "bg-[#FF5B04] hover:bg-[#e04f00] text-white transition-colors",
    formFieldInput: "bg-white border-[#d1d5db] text-[#1a1a1a] focus:ring-[#FF5B04] focus:border-[#FF5B04]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#e5e7eb]",
    alert: "border border-[#fecaca] bg-[#fef2f2]",
    otpCodeFieldInput: "border-[#d1d5db] text-[#1a1a1a]",
    formFieldRow: "",
    main: "",
    badge: { display: "none" },
    developmentModeNotice: { display: "none" },
    impersonationFab: { display: "none" },
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF7F2] px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#FAF7F2] px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
    </div>
  );
}

function useHideClerkDevBadge() {
  useEffect(() => {
    const BADGE_CLASS_RE = /cl-badge|cl-devMode|cl-DevMode|cl-internal-badge/i;

    const killByClass = (node: Element) => {
      if (
        node instanceof HTMLElement &&
        (BADGE_CLASS_RE.test(node.className?.toString() ?? "") ||
          node.getAttribute("data-clerk-badge") != null)
      ) {
        node.style.setProperty("display", "none", "important");
      }
    };

    // Target leaf nodes only — avoids hiding parent containers
    const killBadgeLeaf = (node: Element) => {
      if (node instanceof HTMLElement && node.children.length === 0) {
        const own = node.textContent?.trim().toLowerCase();
        if (own === "development mode" || own === "dev mode") {
          const parent = node.parentElement;
          if (parent) parent.style.setProperty("display", "none", "important");
          node.style.setProperty("display", "none", "important");
        }
      }
    };

    const sweep = (root: Element | Document = document) => {
      (root instanceof Document ? root.querySelectorAll("*") : root.querySelectorAll("*"))
        .forEach((el) => {
          killByClass(el);
          killBadgeLeaf(el);
        });
    };

    sweep();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((n) => {
          if (n instanceof Element) {
            killByClass(n);
            killBadgeLeaf(n);
            sweep(n);
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  useHideClerkDevBadge();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Authed({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      <Route path="/dashboard">
        <Authed>
          <DashboardPage />
        </Authed>
      </Route>

      <Route path="/ideas">
        <Authed>
          <IdeasPage />
        </Authed>
      </Route>
      <Route path="/ideas/:id">
        {(params) => (
          <Authed>
            <IdeaDetailPage id={params.id} />
          </Authed>
        )}
      </Route>

      <Route path="/decks/:deckId">
        {(params) => (
          <Authed>
            <DeckViewerPage deckId={params.deckId} />
          </Authed>
        )}
      </Route>

      <Route path="/train">
        <Authed>
          <TrainPage />
        </Authed>
      </Route>
      <Route path="/train/new">
        <Authed>
          <TrainNewPage />
        </Authed>
      </Route>
      <Route path="/train/:id">
        {(params) => (
          <Authed>
            <TrainSessionPage id={params.id} />
          </Authed>
        )}
      </Route>

      <Route path="/learning">
        <Authed>
          <LearningPage />
        </Authed>
      </Route>
      <Route path="/learning/:slug">
        {(params) => (
          <Authed>
            <LearningTopicPage slug={params.slug} />
          </Authed>
        )}
      </Route>

      <Route path="/settings">
        <Authed>
          <SettingsPage />
        </Authed>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      signInFallbackRedirectUrl={`${basePath}/dashboard`}
      signUpFallbackRedirectUrl={`${basePath}/dashboard`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back, founder",
            subtitle: "Sign in to your PitchMind account",
          },
        },
        signUp: {
          start: {
            title: "Start your pitch journey",
            subtitle: "Create your free PitchMind account",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
