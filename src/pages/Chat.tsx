import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";

type Message = { id: string; role: "user" | "assistant"; content: string };

// ✅ Type cho response từ backend
type ChatResponse = {
  doableFrames?: {
    add_expense?: { insertedCount?: number; insertedIds?: string[] };
    delete_expense?: { deletedCount?: number };
    update_expense?: { modifiedCount?: number };
    search_expense?: any[];
    stat_expense?: {
      total_expense?: number;
      total_income?: number;
      expense_count?: number;
      income_count?: number;
      [key: string]: any;
    };
  };
  incompleteFrames?: any[];
  message?: string | null;
};

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

  // ✅ Function để format message từ doableFrames
  function formatResponseMessage(doableFrames: ChatResponse["doableFrames"]): string {
    if (!doableFrames) return "Đã xử lý yêu cầu của bạn.";

    const messages: string[] = [];

    // Format add_expense
    if (doableFrames.add_expense) {
      const count = doableFrames.add_expense.insertedCount || 0;
      if (count > 0) {
        messages.push(`Đã thêm ${count} chi tiêu${count > 1 ? "" : ""}.`);
      }
    }

    // Format delete_expense
    if (doableFrames.delete_expense) {
      const count = doableFrames.delete_expense.deletedCount || 0;
      if (count > 0) {
        messages.push(`Đã xóa ${count} chi tiêu${count > 1 ? "" : ""}.`);
      }
    }

    // Format update_expense
    if (doableFrames.update_expense) {
      const count = doableFrames.update_expense.modifiedCount || 0;
      if (count > 0) {
        messages.push(`Đã cập nhật ${count} chi tiêu${count > 1 ? "" : ""}.`);
      }
    }

    // Format search_expense
    if (doableFrames.search_expense && Array.isArray(doableFrames.search_expense)) {
      const count = doableFrames.search_expense.length;
      if (count > 0) {
        messages.push(`Tìm thấy ${count} chi tiêu${count > 1 ? "" : ""}.`);
      }
    }

    // Format stat_expense
    if (doableFrames.stat_expense) {
      const stats = doableFrames.stat_expense;
      const statMessages: string[] = [];
      
      if (stats.total_expense !== undefined && stats.total_expense !== null) {
        statMessages.push(`Tổng chi tiêu: ${Number(stats.total_expense).toLocaleString("vi-VN")} VNĐ`);
      }
      if (stats.total_income !== undefined && stats.total_income !== null) {
        statMessages.push(`Tổng thu nhập: ${Number(stats.total_income).toLocaleString("vi-VN")} VNĐ`);
      }
      if (stats.expense_count !== undefined && stats.expense_count !== null) {
        statMessages.push(`Số lượng chi tiêu: ${stats.expense_count}`);
      }
      if (stats.income_count !== undefined && stats.income_count !== null) {
        statMessages.push(`Số lượng thu nhập: ${stats.income_count}`);
      }
      
      if (statMessages.length > 0) {
        messages.push(statMessages.join(", "));
      }
    }

    return messages.length > 0 
      ? messages.join(" ") 
      : "Đã xử lý yêu cầu của bạn.";
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const user_id = "68b3d1ae0be9bb8228499d9f"; // User ID từ Postman collection
      const response = await apiPost<ChatResponse>(`/v1/chat?user_id=${user_id}`, {
        utterance: trimmed,
      });
      
      // ✅ Xử lý response: ưu tiên message từ backend, nếu không có thì format từ doableFrames
      let botMessage: string;
      
      if (response.message) {
        // Có message từ backend (thường là khi thiếu thông tin)
        botMessage = response.message;
      } else if (response.doableFrames) {
        // Không có message nhưng có doableFrames -> format từ results
        botMessage = formatResponseMessage(response.doableFrames);
      } else {
        // Fallback
        botMessage = "Đã xử lý yêu cầu của bạn.";
      }
      
      const botMsg: Message = { 
        id: crypto.randomUUID(), 
        role: "assistant", 
        content: botMessage
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




