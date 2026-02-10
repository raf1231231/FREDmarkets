import { Router } from "express";
import { listMarkets, getMarketById } from "../services/market";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);

    const result = await listMarkets({ status, page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const market = await getMarketById(req.params.id);
    if (!market) {
      res.status(404).json({ error: "NotFound", message: "Market not found" });
      return;
    }
    res.json(market);
  } catch (err) {
    next(err);
  }
});

export default router;
