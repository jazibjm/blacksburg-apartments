import { useState } from "react";

interface ListingProps {
  listing: {
    id: number;
    name: string;
    address: string;
    price: string;
    beds: string;
    amenities: string;
    image_url: string;
    url: string;
  };
  darkMode: boolean;
}

export default function ListingCard({ listing, darkMode }: ListingProps) {
  const [hovered, setHovered] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const amenities = listing.amenities.split(",").map((a) => a.trim());

  const fetchSummary = async () => {
    if (summary || loadingSummary) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/listings/${encodeURIComponent(listing.name)}/summary`
      );
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error("AI summary fetch failed:", err);
      setSummary("Failed to fetch summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
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
        <img
          src={listing.image_url}
          alt={listing.name}
          style={{ width: "100%", height: "220px", objectFit: "cover" }}
        />
        {hovered && (
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
            View Details
          </div>
        )}
      </div>

      <div style={{ padding: "1rem", flex: 1 }}>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>
          {listing.name}
        </h2>
        <p style={{ margin: "0 0 0.25rem", color: darkMode ? "#aaa" : "#555" }}>
          {listing.address}
        </p>
        <p
          style={{
            margin: "0 0 0.25rem",
            fontWeight: "bold",
            color: darkMode ? "#fff" : "#333",
          }}
        >
          {listing.price}
        </p>
        <p style={{ margin: "0 0 0.5rem", color: darkMode ? "#ccc" : "#777" }}>
          {listing.beds}
        </p>

        {/* Amenities */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
          {amenities.map((a, i) => (
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
          onClick={(e) => {
            e.preventDefault();
            fetchSummary();
          }}
          disabled={loadingSummary || !!summary}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "8px",
            border: "none",
            cursor: loadingSummary || summary ? "not-allowed" : "pointer",
            backgroundColor: darkMode ? "#555" : "#eee",
            color: darkMode ? "#fff" : "#000",
            fontWeight: "bold",
            transition: "all 0.2s ease",
          }}
        >
          {loadingSummary ? "Loading..." : summary ? "Summary Loaded" : "Get AI Overview"}
        </button>

        {/* Summary Box */}
        {summary && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              backgroundColor: darkMode ? "#222" : "#f9f9f9",
              borderRadius: "8px",
              fontSize: "0.85rem",
              lineHeight: 1.4,
              transition: "max-height 0.3s ease",
            }}
          >
            {summary}
          </div>
        )}
      </div>
    </a>
  );
}
