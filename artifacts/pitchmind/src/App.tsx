import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";
import LandingPage from "@/pages/Landing";
import LoginPage from "@/pages/Login";
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
      <Route path="/login" component={LoginPage} />

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
