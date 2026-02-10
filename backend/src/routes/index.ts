import { Router } from "express";
import healthRouter from "./health";
import marketsRouter from "./markets";
import fredRouter from "./fred";

const router = Router();

router.use("/health", healthRouter);
router.use("/markets", marketsRouter);
router.use("/fred", fredRouter);

export default router;
