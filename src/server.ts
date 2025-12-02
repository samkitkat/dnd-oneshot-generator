// src/server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import oneshotsRouter from "./routes/oneshots";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/oneshots", oneshotsRouter);

// ---- Serve frontend build in production ----
const distPath = path.resolve(__dirname, "../frontend/dist");

// Serve static assets
app.use(express.static(distPath));

// SPA fallback: for any non-API route, send index.html
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
