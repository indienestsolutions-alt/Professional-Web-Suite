import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, learningTopicsTable } from "@workspace/db";
import {
  ListLearningTopicsResponse,
  GetLearningTopicParams,
  GetLearningTopicResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get(
  "/learning",
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db
      .select()
      .from(learningTopicsTable)
      .orderBy(learningTopicsTable.title);
    res.json(ListLearningTopicsResponse.parse(rows));
  },
);

router.get(
  "/learning/:slug",
  async (req: Request, res: Response): Promise<void> => {
    const params = GetLearningTopicParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [topic] = await db
      .select()
      .from(learningTopicsTable)
      .where(eq(learningTopicsTable.slug, params.data.slug));
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    res.json(GetLearningTopicResponse.parse(topic));
  },
);

export default router;
