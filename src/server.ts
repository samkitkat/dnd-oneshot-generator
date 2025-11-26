import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import oneshotsRouter from "./routes/oneshots";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- API routes ---
app.use("/api/oneshots", oneshotsRouter);

// --- Serve React build in production ---
const distPath = path.join(__dirname, "../frontend/dist");

// Serve static files from the Vite build
app.use(express.static(distPath));

// Match any route that does NOT start with /api
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
