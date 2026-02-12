import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  searchSeries,
  getSeries,
  getObservations,
  getBatchObservations,
} from "../services/fred";

const router = Router();

// Rate limit FRED proxy routes: 60 requests per minute per IP
const fredLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "RateLimited", message: "Too many FRED API requests" },
});

router.use(fredLimiter);

router.get("/search", async (req, res, next) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      res
        .status(400)
        .json({ error: "BadRequest", message: "Query parameter 'q' required" });
      return;
    }
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const data = await searchSeries(q, limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/series/:seriesId", async (req, res, next) => {
  try {
    const data = await getSeries(req.params.seriesId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get("/observations/:seriesId", async (req, res, next) => {
  try {
    const limit = req.query.limit as string | undefined;
    const sort_order = req.query.sort_order as string | undefined;
    const data = await getObservations(req.params.seriesId, {
      limit,
      sort_order,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/batch-observations", async (req, res, next) => {
  try {
    const { seriesIds, limit, frequencyMap } = req.body || {};
    if (
      !Array.isArray(seriesIds) ||
      seriesIds.length === 0 ||
      seriesIds.length > 150
    ) {
      res.status(400).json({
        error: "BadRequest",
        message: "seriesIds must be an array of 1-150 IDs",
      });
      return;
    }
    const data = await getBatchObservations(
      seriesIds,
      String(limit || 13),
      frequencyMap
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Admin endpoint to view cache stats
router.get("/cache-stats", async (req, res) => {
  const { getCacheStats } = await import("../services/fred");
  res.json(getCacheStats());
});

export default router;
