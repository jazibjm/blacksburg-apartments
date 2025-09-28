import { useState, useEffect, useRef } from "react";

export default function ChatWidget() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string; id: number }[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user" as const, content: input, id: nextId.current++ };
    setMessages((msgs) => [...msgs, userMessage]);
    setInput("");

    try {
      const res = await fetch("http://localhost:4000/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      const data = await res.json();
      const assistantMessage = { role: "assistant" as const, content: data.answer, id: nextId.current++ };
      setMessages((msgs) => [...msgs, assistantMessage]);
    } catch {
      const errorMessage = { role: "assistant" as const, content: "Sorry, I couldn't process that request.", id: nextId.current++ };
      setMessages((msgs) => [...msgs, errorMessage]);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "1rem", right: "1rem", zIndex: 9999, fontFamily: "'Inter', sans-serif" }}>
      
      {/* Chat Bubble */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#333",
            color: "#fff",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            fontWeight: "bold",
            fontSize: "1.2rem",
            transform: "scale(1)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          AI
        </div>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div
          style={{
            width: "380px",
            height: "480px",
            backgroundColor: "#fff",
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
          <div
            style={{
              backgroundColor: "#333",
              color: "#fff",
              padding: "0.75rem 1rem",
              fontWeight: "bold",
              cursor: "pointer",
              userSelect: "none",
              fontSize: "1rem",
            }}
            onClick={() => setIsOpen(false)}
          >
            AI Assistant ▲
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: "0.75rem", overflowY: "auto" }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  textAlign: m.role === "user" ? "right" : "left",
                  margin: "0.35rem 0",
                  opacity: 0,
                  animation: "fadeIn 0.3s forwards",
                  animationDelay: `${m.id * 0.05}s`,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.55rem 0.9rem",
                    borderRadius: "14px",
                    backgroundColor: m.role === "user" ? "#333" : "#eee",
                    color: m.role === "user" ? "#fff" : "#000",
                    maxWidth: "80%",
                    wordBreak: "break-word",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    fontSize: "0.95rem",
                  }}
                >
                  {m.content}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: "flex", padding: "0.5rem", gap: "0.5rem", borderTop: "1px solid #ccc" }}>
            <input
              style={{
                flex: 1,
                padding: "0.6rem 1rem",
                borderRadius: "12px",
                border: "1px solid #ccc",
                outline: "none",
                fontSize: "0.95rem",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.05)",
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "0 1rem",
                border: "none",
                borderRadius: "12px",
                backgroundColor: "#333",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "0.95rem",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#555")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#333")}
            >
              Send
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
