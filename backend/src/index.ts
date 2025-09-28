import express from "express";
import cors from "cors";
import { pool } from "./services/db";
import { getApartmentSummary, getAIAnswer } from "./services/ai";

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get("/health", (_, res) => res.json({ status: "ok" }));

// All listings
app.get("/api/listings", async (_, res) => {
  try {
    const result = await pool.query("SELECT * FROM apartments");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB query failed" });
  }
});

// AI review summary
app.get("/api/listings/:name/summary", async (req, res) => {
  try {
    const summary = await getApartmentSummary(req.params.name);
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI summary failed" });
  }
});

// General AI (memory handled in frontend)
app.post("/api/ai", async (req, res) => {
  const { messages } = req.body; // array of { role, content }
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing messages array" });
  }

  try {
    const answer = await getAIAnswer(messages);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI request failed" });
  }
});

app.listen(4000, () =>
  console.log("Backend running at http://localhost:4000")
);
