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
      // TODO: Uncomment khi backend đã có API
      // const response = await apiPost<{ response: string }>("/v1/chat", {
      //   utterance: trimmed,
      // });
      // const botMsg: Message = { 
      //   id: crypto.randomUUID(), 
      //   role: "assistant", 
      //   content: response.response || "An error occurred while summarizing transactions. Please try again."
      // };

      // Tạm thời dùng mock reply
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      const botMsg: Message = { 
        id: crypto.randomUUID(), 
        role: "assistant", 
        content: generateBotReply(trimmed)
      };
      
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const botMsg: Message = { 
        id: crypto.randomUUID(), 
        role: "assistant", 
        content: "An error occurred while summarizing transactions. Please try again."
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  }

  function generateBotReply(text: string): string {
    const lower = text.toLowerCase();
    if (/(ăn|uống|food|drink)/.test(lower)) return "Bạn đang nói về chi tiêu ăn uống. Bạn muốn ghi lại khoản này không?";
    if (/(đi lại|taxi|grab|bus|transport)/.test(lower)) return "Chi tiêu đi lại có thể gộp theo tuần để dễ theo dõi.";
    if (/(hóa đơn|hoá đơn|bill|electric|water|internet)/.test(lower)) return "Mẹo: Đặt nhắc lịch thanh toán hóa đơn để tránh trễ hạn.";
    if (/(tiết kiệm|saving|budget)/.test(lower)) return "Gợi ý: Trích 20% thu nhập vào ví tiết kiệm mỗi tháng.";
    if (/(xin chào|chào|hello|hi)/.test(lower)) return "Chào bạn! Mình có thể hỗ trợ theo dõi chi tiêu và thống kê.";
    return "Mình đã nhận thông tin. Bạn có muốn tạo giao dịch mới hoặc xem thống kê không?";
  }

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




