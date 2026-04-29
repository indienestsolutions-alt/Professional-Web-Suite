import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ideasRouter from "./ideas";
import decksRouter from "./decks";
import personasRouter from "./personas";
import sessionsRouter from "./sessions";
import learningRouter from "./learning";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(ideasRouter);
router.use(decksRouter);
router.use(personasRouter);
router.use(sessionsRouter);
router.use(learningRouter);
router.use(dashboardRouter);

export default router;
