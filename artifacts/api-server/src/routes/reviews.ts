import { Router, type IRouter, type Request, type Response } from "express";
import { desc, eq } from "drizzle-orm";
import { db, reviewsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/requireAuth";

const router: IRouter = Router();

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

router.post("/reviews", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { rating, description, sessionId } = req.body ?? {};

  if (typeof rating !== "number" || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    res.status(400).json({ error: "Rating must be an integer 1–5" });
    return;
  }
  if (typeof description !== "string" || description.trim().length < 10 || description.trim().length > 1000) {
    res.status(400).json({ error: "Description must be 10–1000 characters" });
    return;
  }

  const userId = req.user!.id;

  if (typeof sessionId === "string" && sessionId.length > 0) {
    const existing = await db
      .select({ id: reviewsTable.id })
      .from(reviewsTable)
      .where(eq(reviewsTable.sessionId, sessionId))
      .limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Already reviewed this session" });
      return;
    }
  }

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
      sessionId: typeof sessionId === "string" ? sessionId : null,
      rating,
      description: description.trim(),
      displayName,
    })
    .returning();

  res.status(201).json(review);
});

export default router;
