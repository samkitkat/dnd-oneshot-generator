import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Simple health check route
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "D&D One-Shot API running" });
});

// Temporary test API route
app.get("/api/hello", (_req, res) => {
  res.json({ message: "Hello from the backend 👋" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
