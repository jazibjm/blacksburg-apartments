import OpenAI from "openai";
import { pool } from "./db";

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ApartmentSummary = {
  verdict: string;
  bestFor: string[];
  highlights: string[];
  tradeoffs: string[];
  note?: string;
};

type ApartmentRow = {
  name: string | null;
  address: string | null;
  price: string | null;
  beds: string | null;
  amenities: string | null;
  summary: string | null;
};

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const SUMMARY_CACHE_PREFIX = "summary:v2:";
const REVIEW_DATA_NOTE =
  "No resident review snippets are stored yet, so these are verification points rather than confirmed complaint trends.";
const CHAT_SYSTEM_PROMPT =
  "You help Virginia Tech students compare Blacksburg, VA apartments. Be concise, practical, and honest about uncertainty. Do not invent current prices, availability, review claims, or lease terms. Avoid Markdown syntax.";

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

function isOpenAIConfigError(err: unknown) {
  return err instanceof Error && err.message === "OPENAI_API_KEY is not configured";
}

function getOpenAIErrorCode(err: unknown) {
  if (!err || typeof err !== "object" || !("code" in err)) return undefined;
  return (err as { code?: unknown }).code;
}

function compactList(values: unknown, fallback: string[] = []) {
  if (!Array.isArray(values)) return fallback;
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function normalizeSummary(value: unknown, fallbackName: string): ApartmentSummary {
  if (!value || typeof value !== "object") {
    return buildFallbackSummary({ name: fallbackName, address: null, price: null, beds: null, amenities: null, summary: null });
  }

  const candidate = value as Partial<ApartmentSummary>;
  const modelNote =
    typeof candidate.note === "string" && candidate.note.trim() ? candidate.note.trim() : "";
  const note = modelNote.toLowerCase().includes("review")
    ? modelNote
    : [modelNote, REVIEW_DATA_NOTE].filter(Boolean).join(" ");

  return {
    verdict:
      typeof candidate.verdict === "string" && candidate.verdict.trim()
        ? candidate.verdict.trim()
        : `${fallbackName} may be worth comparing if its location, rent, and floor plans match your priorities.`,
    bestFor: compactList(candidate.bestFor, ["Students comparing Blacksburg options"]),
    highlights: compactList(candidate.highlights, ["Check the official listing for the latest apartment details."]),
    tradeoffs: compactList(candidate.tradeoffs, ["Verify current pricing, availability, fees, and lease terms before applying."]),
    note,
  };
}

function parseCachedSummary(summary: string | null, fallbackName: string) {
  if (!summary?.startsWith(SUMMARY_CACHE_PREFIX)) return null;

  try {
    return normalizeSummary(JSON.parse(summary.slice(SUMMARY_CACHE_PREFIX.length)), fallbackName);
  } catch {
    return null;
  }
}

function buildFallbackSummary(apartment: ApartmentRow): ApartmentSummary {
  const name = apartment.name || "This apartment";
  const amenities = apartment.amenities
    ? apartment.amenities.split(",").map((item) => item.trim()).filter(Boolean)
    : [];
  const highlightAmenities = amenities.slice(0, 3);

  return {
    verdict: `${name} is worth a look if its location, floor plan, and listed rent fit your search.`,
    bestFor: [
      apartment.beds ? `Renters looking for ${apartment.beds.toLowerCase()} layouts` : "Students comparing Blacksburg options",
      apartment.address ? "People prioritizing the listed Blacksburg location" : "Renters who want to compare details directly",
    ],
    highlights: [
      apartment.price ? `Listed rent: ${apartment.price}` : "Price should be verified with the leasing office",
      apartment.beds ? `Listed floor plans: ${apartment.beds}` : "Floor plan details should be verified",
      highlightAmenities.length ? `Amenities listed: ${highlightAmenities.join(", ")}` : "Amenities were not captured in the listing data",
    ],
    tradeoffs: [
      "Current availability, fees, utilities, and lease terms may differ from the scraped listing.",
      "No resident review snippets are stored yet, so repeated complaint themes are not shown as facts.",
      "Tour the unit or ask the leasing office about noise, maintenance timing, parking, and renewal pricing.",
    ],
    note: `Generated from listing data only. ${REVIEW_DATA_NOTE}`,
  };
}

export async function getApartmentSummary(name: string) {
  const result = await pool.query<ApartmentRow>(
    "SELECT name, address, price, beds, amenities, summary FROM apartments WHERE name=$1",
    [name]
  );
  const apartment = result.rows[0] || { name, address: null, price: null, beds: null, amenities: null, summary: null };
  const cached = parseCachedSummary(apartment.summary, apartment.name || name);
  if (cached) return cached;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You create concise apartment comparison cards. Return only valid JSON with keys: verdict, bestFor, highlights, tradeoffs, note. No Markdown.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task:
              "Create a short, honest overview from this listing data only. No review text is available, so do not say reviews mention anything. Tradeoffs must be framed as items to verify, not confirmed complaints. Keep verdict under 28 words and each list item under 18 words.",
            listing: {
              name: apartment.name || name,
              address: apartment.address,
              price: apartment.price,
              beds: apartment.beds,
              amenities: apartment.amenities,
            },
          }),
        },
      ],
    });

    let parsedSummary: unknown = {};
    try {
      parsedSummary = JSON.parse(response.choices[0].message?.content || "{}");
    } catch {
      parsedSummary = {};
    }

    const summary = normalizeSummary(parsedSummary, apartment.name || name);
    await pool.query("UPDATE apartments SET summary=$1 WHERE name=$2", [
      `${SUMMARY_CACHE_PREFIX}${JSON.stringify(summary)}`,
      apartment.name || name,
    ]);
    return summary;
  } catch (err) {
    if (isOpenAIConfigError(err)) {
      console.warn("AI summary skipped: OPENAI_API_KEY is not configured");
      return buildFallbackSummary(apartment);
    }

    console.error("AI summary error:", err);
    const code = getOpenAIErrorCode(err);
    if (code === "insufficient_quota" || code === "rate_limit_exceeded") {
      return buildFallbackSummary(apartment);
    }
    throw err;
  }
}

export async function getAIAnswer(messages: ConversationMessage[]) {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...messages],
    });
    return response.choices[0].message?.content || "No answer available.";
  } catch (err) {
    if (isOpenAIConfigError(err)) {
      console.warn("AI answer skipped: OPENAI_API_KEY is not configured");
      return "AI assistant is not configured yet. Add OPENAI_API_KEY to backend/.env and restart the backend.";
    }

    console.error("AI answer error:", err);
    return "Unable to answer right now. Try again later.";
  }
}
