import { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "../config";
import { getLocalAssistantAnswer } from "../data/fallbackListings";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  id: number;
};

interface ChatWidgetProps {
  darkMode: boolean;
}

function cleanAssistantText(content: string) {
  return content
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+(\d+\.)\s+/g, "\n$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ChatWidget({ darkMode }: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: "assistant", content: "Hi! How may I assist you with Blacksburg apartments today?", id: nextId.current++ }]);
    }
  }, [isOpen, messages.length]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isSending) return;

    const userMessage = { role: "user" as const, content: trimmedInput, id: nextId.current++ };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const assistantMessage = {
        role: "assistant" as const,
        content: data.answer || "I couldn't find an answer for that.",
        id: nextId.current++,
      };
      setMessages((msgs) => [...msgs, assistantMessage]);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("Using local assistant because the API is unavailable:", err);
      }
      const errorMessage = { role: "assistant" as const, content: getLocalAssistantAnswer(trimmedInput), id: nextId.current++ };
      setMessages((msgs) => [...msgs, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const panelBackground = darkMode ? "#111827" : "#fff";
  const panelText = darkMode ? "#f7f7f7" : "#111";
  const subtleBorder = darkMode ? "#2f3a4a" : "#d7d7d7";
  const headerBackground = darkMode ? "#0b1220" : "#333";
  const userBubble = darkMode ? "#2f6fed" : "#333";
  const assistantBubble = darkMode ? "#1f2937" : "#eee";

  return (
    <div style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 9999, fontFamily: "'Inter', sans-serif" }}>
      
      {/* Chat Bubble */}
      {!isOpen && (
        <button
          type="button"
          aria-label="Open AI assistant"
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: headerBackground,
            border: `1px solid ${subtleBorder}`,
            color: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            fontWeight: "bold",
            fontFamily: "inherit",
            fontSize: "1.2rem",
            transform: "scale(1)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          AI
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div
          style={{
            width: "380px",
            height: "480px",
            maxWidth: "calc(100vw - 2rem)",
            backgroundColor: panelBackground,
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transform: "translateY(20px)",
            opacity: 0,
            animation: "slideIn 0.3s forwards",
          }}
        >
          {/* Title bar */}
          <button
            type="button"
            aria-label="Close AI assistant"
            style={{
              width: "100%",
              backgroundColor: headerBackground,
              color: "#fff",
              padding: "0.75rem 1rem",
              fontWeight: "bold",
              fontFamily: "inherit",
              border: "none",
              cursor: "pointer",
              userSelect: "none",
              fontSize: "1rem",
              textAlign: "left",
            }}
            onClick={() => setIsOpen(false)}
          >
            AI Assistant ▲
          </button>

          {/* Messages */}
          <div style={{ flex: 1, padding: "0.75rem", overflowY: "auto" }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  textAlign: m.role === "user" ? "right" : "left",
                  margin: "0.35rem 0",
                  opacity: 0,
                  animation: "fadeIn 0.2s ease forwards",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.55rem 0.9rem",
                    borderRadius: "14px",
                    backgroundColor: m.role === "user" ? userBubble : assistantBubble,
                    color: m.role === "user" ? "#fff" : panelText,
                    maxWidth: "80%",
                    wordBreak: "break-word",
                    whiteSpace: "pre-line",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    fontSize: "0.95rem",
                  }}
                >
                  {m.role === "assistant" ? cleanAssistantText(m.content) : m.content}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: "flex", padding: "0.5rem", gap: "0.5rem", borderTop: `1px solid ${subtleBorder}` }}>
            <input
              style={{
                flex: 1,
                padding: "0.6rem 1rem",
                borderRadius: "12px",
                border: `1px solid ${subtleBorder}`,
                outline: "none",
                fontSize: "0.95rem",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
                backgroundColor: darkMode ? "#171717" : "#fff",
                color: panelText,
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Type your message..."
              disabled={isSending}
            />
            <button
              onClick={sendMessage}
              disabled={isSending || !input.trim()}
              style={{
                padding: "0 1rem",
                border: "none",
                borderRadius: "12px",
                backgroundColor: userBubble,
                color: "#fff",
                fontWeight: "bold",
                cursor: isSending || !input.trim() ? "not-allowed" : "pointer",
                fontSize: "0.95rem",
                opacity: isSending || !input.trim() ? 0.7 : 1,
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = darkMode ? "#3b7cff" : "#555";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = userBubble;
              }}
            >
              {isSending ? "Sending" : "Send"}
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
