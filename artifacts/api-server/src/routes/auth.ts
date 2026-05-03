import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/auth/user", (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.json({ user: null });
    return;
  }
  res.json({ user: { id: userId } });
});

export default router;
