import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config";
import routes from "./routes";
import { errorHandler } from "./middleware/error";

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
});

export default app;
