import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middleware/error";
import { warmCache } from "./services/fred";
import { ALL_SERIES_IDS, FREQUENCY_MAP } from "./config/seriesCatalog";

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

  // Note: Cache warming disabled to avoid FRED API rate limits on startup
  // Cache will be populated lazily as requests come in
  // Data cached for 24 hours (1 hour for daily series) to minimize API calls
  console.log("📋 Lazy cache mode: FRED data will be cached as requested (24hr TTL)");
});

export default app;
