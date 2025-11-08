import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

type Message = { id: string; role: "user" | "assistant"; content: string };

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), role: "assistant", content: "Xin chào! Mình có thể giúp gì cho bạn?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // ✅ Uncomment và sửa để gọi API thật
      const user_id = "68b3d1ae0be9bb8228499d9f"; // User ID từ Postman collection
      const response = await apiPost<{ response: string }>(`/v1/chat?user_id=${user_id}`, {
        utterance: trimmed,
      });
      
      const botMsg: Message = { 
        id: crypto.randomUUID(), 
        role: "assistant", 
        content: response.response || "Xin lỗi, tôi không thể trả lời câu hỏi này."
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const botMsg: Message = { 
        id: crypto.randomUUID(), 
        role: "assistant", 
        content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại."
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Xóa function generateBotReply vì không cần nữa
  // function generateBotReply(text: string): string { ... }

  return (
    <div className="home-page">
      {/* Header */}
      <div className="home-header">
        <h1 className="home-title">Theo dõi chi tiêu</h1>
        <p className="home-subtitle">Your personal expense tracking dashboard</p>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className="nav-tab" 
          onClick={() => navigate("/")}
        >
          Lịch
        </button>
        <button 
          className="nav-tab" 
          onClick={() => navigate("/record")}
        >
          Ghi chép
        </button>
        <button className="nav-tab active">Chat</button>
      </div>

      {/* Chat Container */}
      <div className="chat-container-wrapper">
        <div className="chat-container">
          {/* Chat Header */}
          <div className="chat-header-section">
            <h2 className="chat-title">Chatbot</h2>
            <p className="chat-prompt">
              Hỏi bất cứ điều gì về giao dịch của bạn. e.g., "Tổng chỉ tiêu tuần trước là bao nhiêu?"
            </p>
          </div>

          {/* Messages Area */}
          <div className="chat-messages" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`chat-message ${m.role}`}>
                <div className="chat-message-icon">
                  {m.role === "assistant" ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                </div>
                <div className={`chat-bubble ${m.role}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="chat-message-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div className="chat-bubble assistant">
                  Đang suy nghĩ...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey ? handleSend() : undefined}
              placeholder="Đặt câu hỏi..."
              className="chat-input-field"
              disabled={loading}
            />
            <button 
              className="chat-send-btn" 
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




