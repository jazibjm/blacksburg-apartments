import OpenAI from "openai";
import { pool } from "./db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getApartmentSummary(name: string) {
  const cached = await pool.query("SELECT summary FROM apartments WHERE name=$1", [name]);
  if (cached.rows[0]?.summary) return cached.rows[0].summary;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful apartment reviewer in Blacksburg VA." },
        { role: "user", content: `Give an overview of ${name}, including potential negatives from reviews.` },
      ],
    });

    const summary = response.choices[0].message?.content || "No summary available.";
    await pool.query("UPDATE apartments SET summary=$1 WHERE name=$2", [summary, name]);
    return summary;
  } catch (err: any) {
    console.error("AI summary error:", err);
    if (err.code === "insufficient_quota" || err.code === "rate_limit_exceeded") {
      return "AI overview unavailable. Please try again later.";
    }
    throw err;
  }
}

// NEW: messages array for ephemeral memory
export async function getAIAnswer(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    });
    return response.choices[0].message?.content || "No answer available.";
  } catch (err: any) {
    console.error("AI answer error:", err);
    return "Unable to answer right now. Try again later.";
  }
}
