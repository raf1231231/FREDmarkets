import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cron from "node-cron";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middleware/error";
import { initOracle, runOracleCycle } from "./services/oracle";

const app = express();

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api", routes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(
    `[FREDmarkets API] Running on http://localhost:${config.port} (${config.nodeEnv})`
  );

  // FRED cache: populated lazily as requests come in (24 hr TTL)
  console.log("📋 Lazy cache mode: FRED data will be cached as requested (24hr TTL)");

  // Oracle relay: initialize + schedule cron
  const oracleEnabled = initOracle();
  if (oracleEnabled) {
    cron.schedule(config.oracleCronSchedule, async () => {
      try {
        await runOracleCycle();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Oracle cron error:", message);
      }
    });
    console.log(`⏰ Oracle cron scheduled: ${config.oracleCronSchedule}`);
  }
});

export default app;
