import express from "express";
import dotenv from "dotenv";
import indexRoute from "./routes/index.route";
import { HttpError } from "./utils/httpError";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/v1", indexRoute);

// 404
app.use((req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.path}`));
});

// error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err?.status || 500;
  res.status(status).json({
    message: err?.message || "Internal Server Error",
    details: err?.details,
  });
});

export default app;
