import { Router, type IRouter } from "express";
import healthRouter from "./health";
import userRouter from "./user";
import conversationsRouter from "./conversations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(userRouter);
router.use(conversationsRouter);

export default router;
