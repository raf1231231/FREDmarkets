import { Router } from "express";
import healthRouter from "./health";
import marketsRouter from "./markets";
import fredRouter from "./fred";
import oracleRouter from "./oracle";

const router = Router();

router.use("/health", healthRouter);
router.use("/markets", marketsRouter);
router.use("/fred", fredRouter);
router.use("/oracle", oracleRouter);

export default router;
