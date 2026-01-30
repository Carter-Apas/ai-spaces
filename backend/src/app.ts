import express, { Application, Request, Response, RequestHandler } from "express";
import cors from "cors";
import pinoHttp, { type Options } from "pino-http";

import { logger } from "@/config/index.js";
import { router as routes } from "@/routes/index.js";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use((pinoHttp as unknown as (opts: Options) => RequestHandler)({ logger }));

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export { app };
