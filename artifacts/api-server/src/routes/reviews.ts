import { Router, type IRouter, type Request, type Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db, reviewsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";
import { z } from "zod";

const router: IRouter = Router();

const SubmitReviewBody = z.object({
  rating: z.number().int().min(1).max(5),
  description: z.string().min(10).max(1000),
  sessionId: z.string().optional(),
});

// Public: get all reviews (for landing page)
router.get("/reviews", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      id: reviewsTable.id,
      rating: reviewsTable.rating,
      description: reviewsTable.description,
      displayName: reviewsTable.displayName,
      createdAt: reviewsTable.createdAt,
    })
    .from(reviewsTable)
    .orderBy(desc(reviewsTable.createdAt))
    .limit(50);
  res.json(rows);
});

// Authenticated: submit a review (once per session)
router.post("/reviews", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = SubmitReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = req.user!.id;

  // If sessionId provided, prevent duplicate review for same session
  if (parsed.data.sessionId) {
    const existing = await db
      .select({ id: reviewsTable.id })
      .from(reviewsTable)
      .where(eq(reviewsTable.sessionId, parsed.data.sessionId))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Already reviewed this session" });
      return;
    }
  }

  // Build display name from user profile
  const [user] = await db
    .select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  let displayName: string | null = null;
  if (user?.firstName) {
    displayName = user.lastName
      ? `${user.firstName} ${user.lastName[0]}.`
      : user.firstName;
  }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      userId,
      sessionId: parsed.data.sessionId ?? null,
      rating: parsed.data.rating,
      description: parsed.data.description,
      displayName,
    })
    .returning();

  res.status(201).json(review);
});

export default router;
