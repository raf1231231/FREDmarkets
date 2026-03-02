/**
 * Oracle relay REST API
 *
 * GET  /api/oracle/status   — public; returns oracle health and last run info
 * POST /api/oracle/trigger  — protected; manually trigger one oracle cycle
 *
 * The trigger endpoint is gated by ORACLE_ADMIN_SECRET (Bearer token or
 * X-Admin-Secret header).  Leave it empty to disable the endpoint entirely.
 */

import { Router, Request, Response, NextFunction } from "express";
import { runOracleCycle, getOracleStatus } from "../services/oracle";
import { config } from "../config";

const router = Router();

// ─── Status ───────────────────────────────────────────────────────────────────

router.get("/status", (_req: Request, res: Response) => {
  res.json(getOracleStatus());
});

// ─── Admin Auth Middleware ────────────────────────────────────────────────────

function requireAdminSecret(req: Request, res: Response, next: NextFunction): void {
  const secret = config.oracleAdminSecret;

  if (!secret) {
    res.status(403).json({
      error: "Forbidden",
      message: "ORACLE_ADMIN_SECRET is not configured — manual trigger is disabled.",
    });
    return;
  }

  // Accept via Authorization: Bearer <secret>  or  X-Admin-Secret: <secret>
  const authHeader = req.headers.authorization;
  const xHeader = req.headers["x-admin-secret"] as string | undefined;

  const provided =
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined) ?? xHeader;

  if (!provided || provided !== secret) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid admin secret." });
    return;
  }

  next();
}

// ─── Manual Trigger ───────────────────────────────────────────────────────────

router.post("/trigger", requireAdminSecret, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("⚡ Oracle manual trigger via API");
    const result = await runOracleCycle();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
