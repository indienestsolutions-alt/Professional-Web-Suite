import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, ideasTable, pitchDecksTable } from "@workspace/db";
import {
  GetDeckParams,
  GetDeckResponse,
  GenerateDeckParams,
  GenerateDeckResponse,
  ListDecksForIdeaParams,
  ListDecksForIdeaResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";
import { generateAIDeckSlides } from "../lib/pitchAi";

const router: IRouter = Router();

router.use("/ideas/:id/decks", requireAuth);
router.use("/decks", requireAuth);

router.get(
  "/ideas/:id/decks",
  async (req: Request, res: Response): Promise<void> => {
    const params = ListDecksForIdeaParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const userId = req.user!.id;
    const decks = await db
      .select()
      .from(pitchDecksTable)
      .where(
        and(
          eq(pitchDecksTable.ideaId, params.data.id),
          eq(pitchDecksTable.userId, userId),
        ),
      )
      .orderBy(desc(pitchDecksTable.createdAt));
    res.json(ListDecksForIdeaResponse.parse(decks));
  },
);

router.post(
  "/ideas/:id/decks",
  async (req: Request, res: Response): Promise<void> => {
    const params = GenerateDeckParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const userId = req.user!.id;
    const [idea] = await db
      .select()
      .from(ideasTable)
      .where(
        and(eq(ideasTable.id, params.data.id), eq(ideasTable.userId, userId)),
      );
    if (!idea) {
      res.status(404).json({ error: "Idea not found" });
      return;
    }

    const { title, storyline, slides } = await generateAIDeckSlides(idea);

    const [deck] = await db
      .insert(pitchDecksTable)
      .values({
        ideaId: idea.id,
        userId,
        title,
        storyline,
        slides,
      })
      .returning();

    if (idea.status !== "deck_generated") {
      await db
        .update(ideasTable)
        .set({ status: "deck_generated", updatedAt: new Date() })
        .where(eq(ideasTable.id, idea.id));
    }

    res.json(GenerateDeckResponse.parse(deck));
  },
);

router.get(
  "/decks/:deckId",
  async (req: Request, res: Response): Promise<void> => {
    const params = GetDeckParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const userId = req.user!.id;
    const [deck] = await db
      .select()
      .from(pitchDecksTable)
      .where(
        and(
          eq(pitchDecksTable.id, params.data.deckId),
          eq(pitchDecksTable.userId, userId),
        ),
      );
    if (!deck) {
      res.status(404).json({ error: "Deck not found" });
      return;
    }
    res.json(GetDeckResponse.parse(deck));
  },
);

export default router;
