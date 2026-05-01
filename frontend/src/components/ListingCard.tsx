import { useState } from "react";

import { API_BASE_URL } from "../config";
import { buildLocalSummary } from "../data/fallbackListings";

export interface Listing {
  id: number;
  name: string | null;
  address: string | null;
  price: string | null;
  beds: string | null;
  amenities: string | null;
  image_url: string | null;
  url: string | null;
}

export interface SummaryDetails {
  verdict: string;
  bestFor: string[];
  highlights: string[];
  tradeoffs: string[];
  note?: string;
}

interface ListingProps {
  listing: Listing;
  darkMode: boolean;
}

function isSummaryDetails(summary: unknown): summary is SummaryDetails {
  if (!summary || typeof summary !== "object") return false;
  const candidate = summary as SummaryDetails;
  return (
    typeof candidate.verdict === "string" &&
    Array.isArray(candidate.bestFor) &&
    Array.isArray(candidate.highlights) &&
    Array.isArray(candidate.tradeoffs)
  );
}

function cleanLegacySummary(summary: string) {
  return summary
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+-\s+/g, "\n")
    .replace(/\s+(\d+\.)\s+/g, "\n$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function SummaryList({
  title,
  items,
  darkMode,
}: {
  title: string;
  items: string[];
  darkMode: boolean;
}) {
  if (!items.length) return null;

  return (
    <section style={{ marginTop: "0.65rem" }}>
      <h3
        style={{
          margin: "0 0 0.3rem",
          color: darkMode ? "#d8dee9" : "#333",
          fontSize: "0.78rem",
          fontWeight: 700,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h3>
      <ul style={{ margin: 0, paddingLeft: "1rem" }}>
        {items.map((item) => (
          <li key={item} style={{ marginBottom: "0.25rem" }}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function SummaryPanel({
  summary,
  darkMode,
}: {
  summary: SummaryDetails | string;
  darkMode: boolean;
}) {
  const summaryColor = darkMode ? "#e9eef5" : "#202124";
  const mutedColor = darkMode ? "#aeb7c4" : "#5f6368";
  const panelStyle = {
    marginTop: "0.75rem",
    padding: "0.75rem",
    backgroundColor: darkMode ? "#20242b" : "#f6f7f8",
    border: `1px solid ${darkMode ? "#343b46" : "#e4e6e8"}`,
    borderRadius: "8px",
    color: summaryColor,
    fontSize: "0.86rem",
    lineHeight: 1.45,
  };

  if (typeof summary === "string") {
    return (
      <div style={{ ...panelStyle, maxHeight: "280px", overflowY: "auto", whiteSpace: "pre-line" }}>
        {cleanLegacySummary(summary)}
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <p style={{ margin: 0, fontWeight: 700 }}>{summary.verdict}</p>
      <SummaryList title="Best For" items={summary.bestFor} darkMode={darkMode} />
      <SummaryList title="Highlights" items={summary.highlights} darkMode={darkMode} />
      <SummaryList title="Verify" items={summary.tradeoffs} darkMode={darkMode} />
      {summary.note && (
        <p style={{ margin: "0.7rem 0 0", color: mutedColor, fontSize: "0.78rem" }}>
          {summary.note}
        </p>
      )}
    </div>
  );
}

export default function ListingCard({ listing, darkMode }: ListingProps) {
  const [hovered, setHovered] = useState(false);
  const [summary, setSummary] = useState<SummaryDetails | string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const listingName = listing.name || "Unnamed apartment";
  const listingUrl = listing.url || "#";
  const hasListingUrl = Boolean(listing.url);
  const amenities = listing.amenities
    ? listing.amenities.split(",").map((a) => a.trim()).filter(Boolean)
    : [];

  const fetchSummary = async () => {
    if (summary || loadingSummary) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/listings/${encodeURIComponent(listingName)}/summary`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSummary(isSummaryDetails(data.summary) ? data.summary : data.summary || "No summary available.");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("Using local summary because the API is unavailable:", err);
      }
      setSummary(buildLocalSummary(listing));
    } finally {
      setLoadingSummary(false);
    }
  };

  const imageFallback = (
    <div
      aria-label={`${listingName} image unavailable`}
      style={{
        width: "100%",
        height: "220px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: darkMode ? "#2b2b2b" : "#ececec",
        color: darkMode ? "#bbb" : "#555",
        fontWeight: 600,
      }}
    >
      {listingName}
    </div>
  );

  const imageContent = listing.image_url && !imageFailed ? (
    <img
      src={listing.image_url}
      alt={listingName}
      onError={() => setImageFailed(true)}
      style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }}
    />
  ) : imageFallback;

  const hoverOverlay = hovered && (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#fff",
        fontWeight: "600",
        fontSize: "1rem",
        transition: "opacity 0.3s ease",
      }}
    >
      {hasListingUrl ? "View Details" : "Details unavailable"}
    </div>
  );

  return (
    <article
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "8px",
        overflow: "hidden",
        textDecoration: "none",
        color: darkMode ? "#fff" : "#000",
        backgroundColor: darkMode ? "#1a1a1a" : "#fff",
        boxShadow: hovered
          ? darkMode
            ? "0 12px 40px rgba(255,255,255,0.1)"
            : "0 12px 40px rgba(0,0,0,0.15)"
          : darkMode
          ? "0 4px 20px rgba(255,255,255,0.05)"
          : "0 4px 20px rgba(0,0,0,0.1)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
        transition: "all 0.3s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image with hover overlay */}
      <div style={{ position: "relative" }}>
        {hasListingUrl ? (
          <a
            href={listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", display: "block", textDecoration: "none" }}
          >
            {imageContent}
            {hoverOverlay}
          </a>
        ) : (
          <>
            {imageContent}
            {hoverOverlay}
          </>
        )}
      </div>

      <div style={{ padding: "1rem", flex: 1 }}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
          {listingName}
        </h2>
        <p style={{ margin: "0 0 0.25rem", color: darkMode ? "#aaa" : "#555" }}>
          {listing.address || "Address unavailable"}
        </p>
        <p
          style={{
            margin: "0 0 0.25rem",
            fontWeight: "bold",
            color: darkMode ? "#fff" : "#333",
          }}
        >
          {listing.price || "Price unavailable"}
        </p>
        <p style={{ margin: "0 0 0.5rem", color: darkMode ? "#ccc" : "#777" }}>
          {listing.beds || "Beds unavailable"}
        </p>

        {/* Amenities */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
          {(amenities.length ? amenities : ["Amenities unavailable"]).map((a, i) => (
            <span
              key={i}
              style={{
                padding: "0.3rem 0.6rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: 500,
                backgroundColor: darkMode ? "#333" : "#f0f0f0",
                color: darkMode ? "#fff" : "#333",
                transition: "all 0.2s ease",
              }}
            >
              {a}
            </span>
          ))}
        </div>

        {/* AI Summary Button */}
        <button
          onClick={fetchSummary}
          disabled={loadingSummary || !!summary}
          style={{
            width: "100%",
            padding: "0.55rem",
            borderRadius: "8px",
            border: "none",
            cursor: loadingSummary || summary ? "not-allowed" : "pointer",
            backgroundColor: darkMode ? "#2f3540" : "#eceff1",
            color: darkMode ? "#f6f8fb" : "#111",
            fontWeight: "bold",
            transition: "all 0.2s ease",
          }}
        >
          {loadingSummary ? "Building overview..." : summary ? "Overview loaded" : "Get AI Overview"}
        </button>

        {summary && <SummaryPanel summary={summary} darkMode={darkMode} />}
      </div>
    </article>
  );
}
