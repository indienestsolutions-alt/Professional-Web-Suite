import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import {
  db,
  ideasTable,
  pitchDecksTable,
  pitchSessionsTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentActivityResponse,
  GetProgressSeriesResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";

const router: IRouter = Router();

router.use("/dashboard", requireAuth);

router.get(
  "/dashboard/summary",
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const [ideas, decks, sessions] = await Promise.all([
      db.select().from(ideasTable).where(eq(ideasTable.userId, userId)),
      db
        .select()
        .from(pitchDecksTable)
        .where(eq(pitchDecksTable.userId, userId)),
      db
        .select()
        .from(pitchSessionsTable)
        .where(eq(pitchSessionsTable.userId, userId))
        .orderBy(asc(pitchSessionsTable.createdAt)),
    ]);

    const finished = sessions.filter((s) => s.status === "finished");
    const lastTwo = finished.slice(-2);
    const latest = finished[finished.length - 1];
    const best = finished.reduce<number | null>(
      (acc, s) =>
        s.overallScore != null && (acc == null || s.overallScore > acc)
          ? s.overallScore
          : acc,
      null,
    );

    let improvementDelta: number | null = null;
    if (lastTwo.length === 2) {
      const a = lastTwo[0]!.overallScore;
      const b = lastTwo[1]!.overallScore;
      if (a != null && b != null) improvementDelta = Math.round((b - a) * 10) / 10;
    }

    res.json(
      GetDashboardSummaryResponse.parse({
        ideaCount: ideas.length,
        deckCount: decks.length,
        sessionCount: sessions.length,
        finishedSessionCount: finished.length,
        latestPitchScore: latest?.overallScore ?? null,
        bestPitchScore: best,
        investorReadiness: latest?.investorReadiness ?? null,
        confidenceLevel: latest?.confidenceScore ?? null,
        improvementDelta,
      }),
    );
  },
);

router.get(
  "/dashboard/recent",
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const [ideas, decks, sessions] = await Promise.all([
      db
        .select()
        .from(ideasTable)
        .where(eq(ideasTable.userId, userId))
        .orderBy(desc(ideasTable.updatedAt))
        .limit(8),
      db
        .select()
        .from(pitchDecksTable)
        .where(eq(pitchDecksTable.userId, userId))
        .orderBy(desc(pitchDecksTable.createdAt))
        .limit(8),
      db
        .select()
        .from(pitchSessionsTable)
        .where(eq(pitchSessionsTable.userId, userId))
        .orderBy(desc(pitchSessionsTable.createdAt))
        .limit(8),
    ]);

    const items = [
      ...ideas.map((i) => ({
        id: `idea-${i.id}`,
        type:
          i.status === "structured" || i.status === "deck_generated"
            ? ("idea_structured" as const)
            : ("idea_created" as const),
        title: i.title,
        description:
          i.status === "draft"
            ? "Idea drafted. Run AI structuring next."
            : i.status === "structured"
              ? "Structured into Problem, Solution, Market, and more."
              : "Pitch deck generated.",
        score: i.validationScore ?? null,
        createdAt: i.updatedAt,
        link: `/ideas/${i.id}`,
      })),
      ...decks.map((d) => ({
        id: `deck-${d.id}`,
        type: "deck_generated" as const,
        title: d.title,
        description: "Auto-generated pitch deck ready to review.",
        score: null,
        createdAt: d.createdAt,
        link: `/decks/${d.id}`,
      })),
      ...sessions.map((s) => ({
        id: `session-${s.id}`,
        type:
          s.status === "finished"
            ? ("session_finished" as const)
            : ("session_started" as const),
        title:
          s.status === "finished"
            ? `Pitch session scored ${Math.round(s.overallScore ?? 0)}`
            : "Pitch training session started",
        description: s.summary ?? "Live pitch session with an investor persona.",
        score: s.overallScore ?? null,
        createdAt: s.createdAt,
        link: `/train/${s.id}`,
      })),
    ];
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.json(GetRecentActivityResponse.parse(items.slice(0, 12)));
  },
);

router.get(
  "/dashboard/progress",
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const finished = await db
      .select()
      .from(pitchSessionsTable)
      .where(
        and(
          eq(pitchSessionsTable.userId, userId),
          eq(pitchSessionsTable.status, "finished"),
          isNotNull(pitchSessionsTable.overallScore),
        ),
      )
      .orderBy(asc(pitchSessionsTable.finishedAt));

    const series = finished.map((s) => ({
      date: s.finishedAt ?? s.createdAt,
      score: s.overallScore ?? 0,
      confidence: s.confidenceScore,
      clarity: s.clarityScore,
      readiness: s.investorReadiness,
    }));

    res.json(GetProgressSeriesResponse.parse(series));
  },
);

export default router;
