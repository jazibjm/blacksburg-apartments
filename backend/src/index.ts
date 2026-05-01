import express from "express";
import cors from "cors";
import { pool } from "./services/db";
import { getApartmentSummary, getAIAnswer } from "./services/ai";
import type { ConversationMessage } from "./services/ai";

const app = express();
app.use(cors());
app.use(express.json());

// Health
app.get("/health", (_, res) => res.json({ status: "ok" }));

// All listings
app.get("/api/listings", async (_, res) => {
  try {
    const result = await pool.query("SELECT * FROM apartments ORDER BY id ASC");
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

function normalizeChatMessages(body: unknown): ConversationMessage[] | null {
  if (!body || typeof body !== "object") return null;

  const payload = body as {
    query?: unknown;
    messages?: unknown;
  };

  if (typeof payload.query === "string" && payload.query.trim()) {
    return [{ role: "user", content: payload.query.trim() }];
  }

  if (!Array.isArray(payload.messages)) return null;

  const messages = payload.messages
    .filter((message): message is ConversationMessage => {
      if (!message || typeof message !== "object") return false;
      const candidate = message as { role?: unknown; content?: unknown };
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string" &&
        candidate.content.trim().length > 0
      );
    })
    .map((message) => ({ role: message.role, content: message.content.trim() }))
    .slice(-12);

  return messages.some((message) => message.role === "user") ? messages : null;
}

// General AI (memory handled in frontend)
app.post("/api/ai", async (req, res) => {
  const messages = normalizeChatMessages(req.body);
  if (!messages) {
    return res.status(400).json({ error: "Send a query string or a messages array." });
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
