import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, ideasTable } from "@workspace/db";
import {
  CreateIdeaBody,
  GetIdeaParams,
  ListIdeasResponse,
  CreateIdeaResponse,
  GetIdeaResponse,
  UpdateIdeaParams,
  UpdateIdeaBody,
  UpdateIdeaResponse,
  DeleteIdeaParams,
  DeleteIdeaResponse,
  StructureIdeaParams,
  StructureIdeaResponse,
  ValidateIdeaParams,
  ValidateIdeaResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";
import { structureIdeaText, validateIdea } from "../lib/pitchAi";

const router: IRouter = Router();

router.use("/ideas", requireAuth);
router.use("/ideas/:id/structure", requireAuth);
router.use("/ideas/:id/validate", requireAuth);

router.get("/ideas", async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const rows = await db
    .select()
    .from(ideasTable)
    .where(eq(ideasTable.userId, userId))
    .orderBy(desc(ideasTable.updatedAt));
  res.json(ListIdeasResponse.parse(rows));
});

router.post("/ideas", async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateIdeaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = req.user!.id;
  const [idea] = await db
    .insert(ideasTable)
    .values({
      userId,
      title: parsed.data.title,
      rawText: parsed.data.rawText,
      status: "draft",
    })
    .returning();
  res.json(CreateIdeaResponse.parse(idea));
});

router.get("/ideas/:id", async (req: Request, res: Response): Promise<void> => {
  const params = GetIdeaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = req.user!.id;
  const [idea] = await db
    .select()
    .from(ideasTable)
    .where(and(eq(ideasTable.id, params.data.id), eq(ideasTable.userId, userId)));
  if (!idea) {
    res.status(404).json({ error: "Idea not found" });
    return;
  }
  res.json(GetIdeaResponse.parse(idea));
});

router.patch(
  "/ideas/:id",
  async (req: Request, res: Response): Promise<void> => {
    const params = UpdateIdeaParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = UpdateIdeaBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const userId = req.user!.id;
    const [idea] = await db
      .update(ideasTable)
      .set({ ...body.data, updatedAt: new Date() })
      .where(
        and(eq(ideasTable.id, params.data.id), eq(ideasTable.userId, userId)),
      )
      .returning();
    if (!idea) {
      res.status(404).json({ error: "Idea not found" });
      return;
    }
    res.json(UpdateIdeaResponse.parse(idea));
  },
);

router.delete(
  "/ideas/:id",
  async (req: Request, res: Response): Promise<void> => {
    const params = DeleteIdeaParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const userId = req.user!.id;
    const [deleted] = await db
      .delete(ideasTable)
      .where(
        and(eq(ideasTable.id, params.data.id), eq(ideasTable.userId, userId)),
      )
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Idea not found" });
      return;
    }
    res.json(DeleteIdeaResponse.parse({ success: true }));
  },
);

router.post(
  "/ideas/:id/structure",
  async (req: Request, res: Response): Promise<void> => {
    const params = StructureIdeaParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const userId = req.user!.id;
    const [existing] = await db
      .select()
      .from(ideasTable)
      .where(
        and(eq(ideasTable.id, params.data.id), eq(ideasTable.userId, userId)),
      );
    if (!existing) {
      res.status(404).json({ error: "Idea not found" });
      return;
    }
    const structured = structureIdeaText(existing.title, existing.rawText);
    const [updated] = await db
      .update(ideasTable)
      .set({
        ...structured,
        status: "structured",
        updatedAt: new Date(),
      })
      .where(eq(ideasTable.id, existing.id))
      .returning();
    res.json(StructureIdeaResponse.parse(updated));
  },
);

router.post(
  "/ideas/:id/validate",
  async (req: Request, res: Response): Promise<void> => {
    const params = ValidateIdeaParams.safeParse(req.params);
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
    const result = await validateIdea(idea);
    await db
      .update(ideasTable)
      .set({
        validationScore: result.score,
        validationStrengths: result.strengths,
        validationWeaknesses: result.weaknesses,
        validationSuggestions: result.suggestions,
        updatedAt: new Date(),
      })
      .where(eq(ideasTable.id, idea.id));
    res.json(ValidateIdeaResponse.parse(result));
  },
);

export default router;
