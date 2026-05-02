import { useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetDashboardSummary,
  useGetRecentActivity,
  useGetProgressSeries,
  getGetDashboardSummaryQueryKey,
  getGetRecentActivityQueryKey,
  getGetProgressSeriesQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@workspace/replit-auth-web";
import { PageContainer, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Mic,
  Presentation,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
} from "recharts";
import { motion } from "framer-motion";
import { formatRelative, formatScore } from "@/lib/format";

export default function DashboardPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const summary = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });
  const recent = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() },
  });
  const progress = useGetProgressSeries({
    query: { queryKey: getGetProgressSeriesQueryKey() },
  });

  const chartData = useMemo(
    () =>
      (progress.data ?? []).map((p, i) => ({
        idx: i + 1,
        date: new Date(p.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        score: Math.round(p.score),
        confidence: p.confidence ?? null,
        clarity: p.clarity ?? null,
        readiness: p.readiness ?? null,
      })),
    [progress.data],
  );

  const s = summary.data;
  const greetingName = user?.firstName ?? "founder";

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <>
            <Sparkles className="h-3.5 w-3.5" />
            Mission control
          </>
        }
        title={`Welcome back, ${greetingName}.`}
        description="Your pitch dojo, your numbers, your next move."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setLocation("/ideas")}
              data-testid="cta-new-idea"
            >
              <Lightbulb className="h-4 w-4 mr-2" /> New idea
            </Button>
            <Button onClick={() => setLocation("/train/new")} data-testid="cta-start-training">
              <Mic className="h-4 w-4 mr-2" /> Start training
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Lightbulb className="h-4 w-4" />}
          label="Ideas in flight"
          value={summary.isLoading ? null : (s?.ideaCount ?? 0).toString()}
          accent="primary"
        />
        <StatCard
          icon={<Presentation className="h-4 w-4" />}
          label="Decks generated"
          value={summary.isLoading ? null : (s?.deckCount ?? 0).toString()}
        />
        <StatCard
          icon={<Mic className="h-4 w-4" />}
          label="Sessions completed"
          value={
            summary.isLoading ? null : (s?.finishedSessionCount ?? 0).toString()
          }
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Latest pitch score"
          value={summary.isLoading ? null : formatScore(s?.latestPitchScore)}
          delta={s?.improvementDelta ?? null}
          accent="accent"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Pitch progress
                  </div>
                  <h2 className="text-xl font-semibold mt-1">
                    Your investor readiness over time
                  </h2>
                </div>
                <Badge variant="outline" className="font-mono">
                  Best: {formatScore(s?.bestPitchScore)}
                </Badge>
              </div>
              <div className="h-72 mt-4 -mx-2">
                {progress.isLoading ? (
                  <Skeleton className="h-full w-full rounded-md" />
                ) : chartData.length === 0 ? (
                  <EmptyChart
                    onClick={() => setLocation("/train/new")}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="scoreGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.45}
                          />
                          <stop
                            offset="100%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="readyGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="hsl(var(--accent))"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="hsl(var(--accent))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="hsl(var(--border))"
                        strokeDasharray="3 6"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <ReTooltip
                        contentStyle={{
                          background: "hsl(var(--popover))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        fill="url(#scoreGrad)"
                        name="Overall"
                      />
                      <Area
                        type="monotone"
                        dataKey="readiness"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        fill="url(#readyGrad)"
                        name="Investor readiness"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Today's drill
            </div>
            <h2 className="text-xl font-semibold mt-1">
              Take one pitch into the arena
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Three minutes. One idea. One investor persona. Find the weakest
              answer and rebuild it.
            </p>
            <div className="mt-5 space-y-2">
              <ScoreRow
                label="Confidence"
                value={s?.confidenceLevel ?? null}
                tone="primary"
              />
              <ScoreRow
                label="Investor readiness"
                value={s?.investorReadiness ?? null}
                tone="accent"
              />
            </div>
            <Button
              className="mt-6 w-full"
              onClick={() => setLocation("/train/new")}
            >
              <Mic className="h-4 w-4 mr-2" />
              Start a session
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionHeading
            title="Recent activity"
            description="Everything you've shipped, structured, or pitched."
          />
          <div className="space-y-2">
            {recent.isLoading ? (
              [...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : (recent.data ?? []).length === 0 ? (
              <EmptyState
                icon={<Activity className="h-5 w-5" />}
                title="No activity yet"
                body="Create your first idea to start building your pitch history."
                cta={
                  <Button onClick={() => setLocation("/ideas")}>
                    <Lightbulb className="h-4 w-4 mr-2" /> Create an idea
                  </Button>
                }
              />
            ) : (
              recent.data!.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link href={item.link ?? "#"}>
                    <a className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors group">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        {iconForActivity(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {item.title}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {item.description}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {item.score != null && (
                          <Badge variant="secondary" className="font-mono">
                            {Math.round(item.score)}
                          </Badge>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatRelative(item.createdAt)}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </a>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div>
          <SectionHeading
            title="Quick paths"
            description="Jump straight to where work happens."
          />
          <div className="space-y-3">
            <QuickAction
              to="/ideas"
              title="New startup idea"
              body="Drop the rough version. Structure it next."
              icon={<Lightbulb className="h-5 w-5" />}
            />
            <QuickAction
              to="/train/new"
              title="Pitch arena"
              body="Pick a persona. Defend your thesis."
              icon={<Mic className="h-5 w-5" />}
            />
            <QuickAction
              to="/learning"
              title="Founder library"
              body="TAM/SAM/SOM, validation, pitch structure."
              icon={<Sparkles className="h-5 w-5" />}
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function StatCard({
  icon,
  label,
  value,
  delta,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  delta?: number | null;
  accent?: "primary" | "accent";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-widest font-mono">
          <span>{label}</span>
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${
              accent === "primary"
                ? "bg-primary/10 text-primary"
                : accent === "accent"
                  ? "bg-accent/10 text-accent"
                  : "bg-muted text-foreground"
            }`}
          >
            {icon}
          </span>
        </div>
        <div className="mt-3 font-display text-2xl lg:text-3xl font-semibold tracking-tight truncate">
          {value === null ? <Skeleton className="h-8 w-16" /> : value}
        </div>
        {delta != null && delta !== 0 && (
          <div
            className={`mt-1 inline-flex items-center gap-1 text-xs font-mono ${
              delta > 0 ? "text-emerald-600" : "text-destructive"
            }`}
          >
            {delta > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta > 0 ? "+" : ""}
            {delta} vs last session
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone: "primary" | "accent";
}) {
  const v = value ?? 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium">
          {value == null ? "—" : Math.round(v)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value == null ? 0 : v}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${
            tone === "primary" ? "bg-primary" : "bg-accent"
          }`}
        />
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  );
}

function QuickAction({
  to,
  title,
  body,
  icon,
}: {
  to: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={to}>
      <a className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors group">
        <div className="h-9 w-9 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-medium">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors mt-2" />
      </a>
    </Link>
  );
}

function EmptyChart({ onClick }: { onClick: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 border border-dashed border-border rounded-md">
      <TrendingUp className="h-6 w-6 text-muted-foreground" />
      <p className="mt-3 font-medium">No sessions scored yet</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Finish your first pitch session and your progress trend lights up here.
      </p>
      <Button size="sm" className="mt-4" onClick={onClick}>
        Start training
      </Button>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 border border-dashed border-border rounded-lg bg-card">
      <div className="h-10 w-10 rounded-md bg-muted text-muted-foreground flex items-center justify-center">
        {icon}
      </div>
      <p className="mt-3 font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{body}</p>
      <div className="mt-4">{cta}</div>
    </div>
  );
}

function iconForActivity(type: string) {
  switch (type) {
    case "deck_generated":
      return <Presentation className="h-4 w-4" />;
    case "session_started":
    case "session_finished":
      return <Mic className="h-4 w-4" />;
    default:
      return <Lightbulb className="h-4 w-4" />;
  }
}
