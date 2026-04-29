import { Router, type IRouter, type Request, type Response } from "express";
import { db, personasTable } from "@workspace/db";
import { ListPersonasResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/personas", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(personasTable).orderBy(personasTable.name);
  res.json(ListPersonasResponse.parse(rows));
});

export default router;
