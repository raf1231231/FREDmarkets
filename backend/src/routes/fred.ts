import { Router } from "express";
import rateLimit from "express-rate-limit";
import { searchSeries, getSeries, getObservations } from "../services/fred";

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

export default router;
