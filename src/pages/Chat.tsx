import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, apiGet, apiPut } from "../lib/api";

// Loại giao dịch để hiển thị và chỉnh sửa nhanh
const CATEGORIES = [
  { value: "FOOD", label: "Ăn uống", icon: "🍽️" },
  { value: "APPLIANCES", label: "Mua sắm", icon: "🛒" },
  { value: "TRANSPORT", label: "Đi lại", icon: "🚗" },
  { value: "HEALTH", label: "Sức khỏe", icon: "🏥" },
  { value: "BILLS", label: "Hóa đơn", icon: "📄" }, 
  { value: "none", label: "Khác", icon: "📦" },
];

type PanelSource = "add" | "update" | "search" | "delete";

// Dạng expense tối thiểu để hiển thị trong panel
type ChatExpense = {
  _id?: string;
  user_id?: string;
  type?: "expense" | "income";
  description: string;
  price: number; // ✅ Xóa amount, chỉ giữ price
  category?: string;
  paid_at: string;
  created_at?: string;
  modified_at?: string;
  panelSource?: PanelSource;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  transactions?: ChatExpense[];
};

const CHAT_STORAGE_KEY = "chat_messages";

type ChatResponse = {
  doableFrames?: any[];
  incompleteFrames?: any[];
  message?: string | null;
  ret?: {
    add_expense?: {
      success?: boolean;
      insertedCount?: number;
      insertedIds?: string[] | Record<string, string>;
      inserted_id?: string | string[] | Record<string, string>;
      [key: string]: any;
    } | null;
    delete_expense?: { deletedCount?: number } | null;
    update_expense?: { modifiedCount?: number } | null;
    search_expense?: any[] | null;
    stat_expense?: Record<string, any> | null;
  };
};

const USER_ID = "68b3d1ae0be9bb8228499d9f";

const toArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") return [value];
  if (typeof value === "object") return Object.values(value as Record<string, string>);
  return [];
};

export default function Chat() {
  const navigate = useNavigate();
  const [editingCategory, setEditingCategory] = useState<Record<string, string>>({});

  const loadMessages = (): Message[] => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!saved) {
        return [
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Xin chào! Mình có thể giúp gì cho bạn?",
          },
        ];
      }

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new Error("Invalid message history");

      return parsed
        .filter((msg: any) => msg && typeof msg.id === "string" && typeof msg.role === "string")
        .map((msg: any) => ({
          id: msg.id,
          role: msg.role === "assistant" ? "assistant" : "user",
          content: typeof msg.content === "string" ? msg.content : "",
          transactions: Array.isArray(msg.transactions)
            ? msg.transactions.map((exp: any) => ({
                _id: exp._id,
                description: exp.description,
                price: Number(exp.price ?? 0), // ✅ Xóa fallback exp.amount
                category: exp.category,
                paid_at: exp.paid_at,
                created_at: exp.created_at,
                modified_at: exp.modified_at,
                user_id: exp.user_id,
                type: exp.type ?? "expense",
                panelSource:
                  exp.panelSource === "update" ||
                  exp.panelSource === "search" ||
                  exp.panelSource === "delete"
                    ? exp.panelSource
                    : "add",
              }))
            : undefined,
        }));
    } catch (error) {
      console.error("Error loading chat history:", error);
      return [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Xin chào! Mình có thể giúp gì cho bạn?",
        },
      ];
    }
  };

  const [messages, setMessages] = useState<Message[]>(loadMessages());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving chat history:", error);
      if (messages.length > 50) {
        const trimmed = messages.slice(-50);
        setMessages(trimmed);
        try {
          localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
        } catch (err) {
          console.error("Error trimming chat history:", err);
        }
      }
    }
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // ✅ Xóa hours và minutes vì không dùng
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount: number) =>
    `${Number(amount || 0).toLocaleString("vi-VN")}₫`;

  const getCategoryInfo = (category?: string) => {
    const found = CATEGORIES.find((cat) => cat.value === category);
    return found || { value: "none", label: "Khác", icon: "📦" };
  };

  const getPanelStatusText = (transaction: ChatExpense) => {
    switch (transaction.panelSource) {
      case "update":
        return "Đã chỉnh sửa";
      case "search":
        return "Kết quả tìm kiếm";
    case "delete":
      return "Đã xóa";
      default:
        return "Đã thêm";
    }
  };

  const getPanelStatusClass = (transaction: ChatExpense) => {
    switch (transaction.panelSource) {
      case "update":
        return "status-update";
      case "search":
        return "status-search";
      case "delete":
        return "status-delete";
      default:
        return "status-add";
    }
  };

  const fetchExpensesByIds = async (ids: string[]): Promise<ChatExpense[]> => {
    const results: ChatExpense[] = [];

    for (const id of ids) {
      try {
        const expense = await apiGet<any>(`/v1/expense/one/${id}`);
        results.push({
          _id: expense._id?.toString() ?? expense._id,
          user_id: expense.user_id,
          type: expense.type ?? "expense",
          description: expense.description,
          price: Number(expense.price ?? 0), // ✅ Xóa fallback expense.amount
          category: expense.category ?? "none",
          paid_at: expense.paid_at,
          created_at: expense.created_at,
          modified_at: expense.modified_at,
        });
      } catch (error) {
        console.error("Error fetching expense", id, error);
      }
    }
    return results;
  };

  const fetchRecentExpenses = async (description?: string, count = 1) => {
    try {
      const res = await apiGet<any>(
        `/v1/expense/many?user_id=${USER_ID}`
      );
      const all = Array.isArray(res.result) ? res.result : [];

      const filtered = all
        .filter((exp: any) =>
          description ? exp.description?.toLowerCase().includes(description.toLowerCase()) : true
        )
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at ?? b.paid_at).getTime() -
            new Date(a.created_at ?? a.paid_at).getTime()
        )
        .slice(0, count);

      return filtered.map(
        (exp: any): ChatExpense => ({
          _id: exp._id?.toString() ?? exp._id,
          user_id: exp.user_id,
          type: exp.type ?? "expense",
          description: exp.description,
          price: Number(exp.price ?? 0), // ✅ Xóa fallback exp.amount
          category: exp.category ?? "none",
          paid_at: exp.paid_at,
          created_at: exp.created_at,
          modified_at: exp.modified_at,
        })
      );
    } catch (error) {
      console.error("Error fetching recent expenses:", error);
      return [];
    }
  };

  const buildSummaryFromRet = (ret: NonNullable<ChatResponse["ret"]>) => {
    const parts: string[] = [];

    if (ret.add_expense?.insertedCount) {
      parts.push(`Đã ghi nhận ${ret.add_expense.insertedCount} khoản chi.`);
    }
    if (ret.delete_expense?.deletedCount) {
      parts.push(`Đã xóa ${ret.delete_expense.deletedCount} giao dịch.`);
    }
    if (ret.update_expense?.modifiedCount) {
      parts.push(`Đã cập nhật ${ret.update_expense.modifiedCount} giao dịch.`);
    }
    if (Array.isArray(ret.search_expense)) {
      parts.push(
        ret.search_expense.length
          ? `Tìm thấy ${ret.search_expense.length} giao dịch.`
          : "Không tìm thấy giao dịch nào."
      );
    }
    if (ret.stat_expense && typeof ret.stat_expense === "object") {
      // ✅ Backend trả về format: { "FOOD": { totalPrice: 50000, count: 1 }, ... }
      // Tính tổng từ tất cả các category
      let totalAmount = 0;
      let totalCount = 0;
      const categoryDetails: string[] = [];

      Object.entries(ret.stat_expense).forEach(([category, data]: [string, any]) => {
        if (data && typeof data === "object") {
          // ✅ Backend trả về totalPrice, không phải totalAmount
          const price = Number(data.totalPrice ?? data.totalAmount ?? 0) || 0;
          const count = Number(data.count) || 0;
          totalAmount += price;
          totalCount += count;

          // Lấy label cho category
          const categoryInfo = CATEGORIES.find(c => c.value === category);
          const categoryLabel = categoryInfo ? categoryInfo.label : category;
          
          if (price > 0) {
            categoryDetails.push(
              `${categoryLabel}: ${formatCurrency(price)} (${count} giao dịch)`
            );
          }
        }
      });

      // Hiển thị tổng
      if (totalAmount > 0) {
        parts.push(`Tổng chi tiêu: ${formatCurrency(totalAmount)} (${totalCount} giao dịch).`);
        
        // Hiển thị chi tiết theo category nếu có nhiều hơn 1 category
        if (categoryDetails.length > 1) {
          parts.push(` Chi tiết: ${categoryDetails.join(", ")}.`);
        }
      } else {
        // ✅ Nếu không có dữ liệu (object rỗng hoặc totalAmount = 0)
        parts.push("Không có giao dịch nào trong khoảng thời gian này.");
      }
    }

    return parts.join(" ").trim();
  };

  // ✅ Xóa hàm parseDateRange - không cần parse ngày tháng ở frontend nữa

  const handleCategoryChange = async (
    expenseId: string,
    newCategory: string,
    messageId: string
  ) => {
    try {
      const expense = await apiGet<any>(`/v1/expense/one/${expenseId}`);

      await apiPut("/v1/expense", [
        {
          _id: expenseId,
          user_id: expense.user_id ?? USER_ID,
          type: expense.type ?? "expense",
          description: expense.description,
          price: Number(expense.price ?? 0), // ✅ Xóa fallback expense.amount
          category: newCategory,
          paid_at: expense.paid_at,
          created_at: expense.created_at,
        },
      ]);

      setMessages((prev) =>
        prev.map((msg) =>
            msg.id !== messageId || !msg.transactions
              ? msg
              : {
                  ...msg,
                  transactions: msg.transactions.map((tx) =>
                    tx._id === expenseId ? { ...tx, category: newCategory } : tx
                  ),
                }
        )
      );
      setEditingCategory((prev) => {
        const next = { ...prev };
        delete next[expenseId];
        return next;
      });
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Không thể cập nhật danh mục. Vui lòng thử lại.");
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiPost<ChatResponse>(
        `/v1/chat?user_id=${USER_ID}`,
        { utterance: trimmed }
      );
      // trong handleSend, ngay sau khi nhận response
      console.log("Chat raw response:", response);
      if (response.doableFrames?.length) {
        console.log(
          "Parsed frames:",
          response.doableFrames.map((f) => ({
            intent: f.intent,
            description: f.description,
            date: f.date instanceof Date ? f.date.toISOString() : f.date,
            condition_date: f.condition_date instanceof Date ? f.condition_date.toISOString() : f.condition_date,
          }))
        );
      }
      if (response.ret?.search_expense) {
        console.log("ret.search_expense:", response.ret.search_expense);
      }
      
      // ✅ Debug: log toàn bộ response để xem backend trả về gì
      console.log("Chat response:", response);
//lag phết
      const summaryParts: string[] = [];
      let summary = "Đã xử lý yêu cầu của bạn.";
      let transactions: ChatExpense[] = [];
      const seenTransactionKeys = new Set<string>();

      const appendUnique = (items: ChatExpense[], source: PanelSource) => {
        if (!items?.length) return;
        items.forEach((item) => {
          const keyBase = item._id ?? `${item.description}-${item.paid_at}`;
          const key = `${source}-${keyBase}`;
          if (!seenTransactionKeys.has(key)) {
            seenTransactionKeys.add(key);
            transactions.push({ ...item, panelSource: source });
          }
        });
      };

      if (response.message) {
        summaryParts.push(response.message);
      }

      if (response.ret) {
        const retSummary = buildSummaryFromRet(response.ret);
        if (retSummary) {
          summaryParts.push(retSummary);
        }

        const insertedIds = [
          ...toArray(response.ret.add_expense?.insertedIds),
          ...toArray(response.ret.add_expense?.inserted_id),
        ];
        if (insertedIds.length > 0) {
          const added = await fetchExpensesByIds([...new Set(insertedIds)]);
          appendUnique(added, "add");
        } else if (response.ret.add_expense?.success) {
          const frame = response.doableFrames?.find(
            (f: any) => f.intent === "add_expense"
          );
          const recent = await fetchRecentExpenses(frame?.description, frame?.count ?? 1);
          appendUnique(recent, "add");
        }

        if (
          Array.isArray(response.ret.search_expense) &&
          response.ret.search_expense.length
        ) {
          const searched = response.ret.search_expense.map((exp: any) => ({
            _id: exp._id?.toString() ?? exp._id,
            user_id: exp.user_id,
            type: exp.type ?? "expense",
            description: exp.description,
            price: Number(exp.price ?? 0), // ✅ Xóa fallback exp.amount
            category: exp.category ?? "none",
            paid_at: exp.paid_at,
            created_at: exp.created_at,
            modified_at: exp.modified_at,
          }));
          appendUnique(searched, "search");
        }

        if (response.ret.update_expense?.modifiedCount) {
          const updateFrames =
            response.doableFrames?.filter((f: any) => f.intent === "update_expense") ?? [];

          const candidateIds = updateFrames
            .map((frame: any) => frame._id)
            .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

          let updated: ChatExpense[] = [];

          if (candidateIds.length > 0) {
            updated = await fetchExpensesByIds([...new Set(candidateIds)]);
          }

          if (updated.length === 0 && updateFrames.length > 0) {
            const fallbackFrame = updateFrames[updateFrames.length - 1];
            const hintDescription =
              fallbackFrame.target_description ||
              fallbackFrame.description ||
              undefined;

            updated = await fetchRecentExpenses(
              hintDescription,
              response.ret.update_expense.modifiedCount ?? 1
            );
          }

          appendUnique(updated, "update");
        }

        if (response.ret.delete_expense?.deletedCount) {
          const deleteFrames =
            response.doableFrames?.filter((f: any) => f.intent === "delete_expense") ?? [];

          const candidateIds = deleteFrames
            .map((frame: any) => frame._id)
            .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

          let deleted: ChatExpense[] = [];

          if (candidateIds.length > 0) {
            deleted = await fetchExpensesByIds([...new Set(candidateIds)]);
          }

          const knownIds = new Set(deleted.map((tx) => tx._id).filter(Boolean) as string[]);

          deleteFrames.forEach((frame: any, index: number) => {
            const frameId =
              typeof frame._id === "string" && frame._id.length > 0 ? frame._id : undefined;
            if (!frameId || !knownIds.has(frameId)) {
              const placeholder: ChatExpense = {
                _id: frameId ?? `deleted-${index}-${Date.now()}`,
                description:
                  frame.description ?? frame.target_description ?? "Giao dịch đã xóa",
                price: Number(frame.price ?? frame.target_price ?? 0) || 0,
                category: frame.category ?? "none",
                paid_at:
                  frame.date instanceof Date
                    ? frame.date.toISOString()
                    : new Date().toISOString(),
                type: "expense",
              };
              deleted.push(placeholder);
              if (frameId) {
                knownIds.add(frameId);
              }
            }
          });

          appendUnique(deleted, "delete");
        }
      } else if (response.doableFrames) {
        const frameSummary = buildSummaryFromRet({
          add_expense: response.doableFrames.find((f) => f.intent === "add_expense"),
          delete_expense: null,
          update_expense: null,
          search_expense: response.doableFrames.find((f) => f.intent === "search_expense")
            ? []
            : null,
          stat_expense: null,
        });
        if (frameSummary) {
          summaryParts.push(frameSummary);
        }
      }

      summary = summaryParts.join(" ").trim() || summary;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: summary,
          transactions: transactions.length ? transactions : undefined,
        },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChatHistory = () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch sử chat?")) return;
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Xin chào! Mình có thể giúp gì cho bạn?",
      },
    ]);
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <h1 className="home-title">Theo dõi chi tiêu</h1>
        <p className="home-subtitle">Your personal expense tracking dashboard</p>
      </div>

      <div className="nav-tabs">
        <button className="nav-tab" onClick={() => navigate("/")}>
          Lịch
        </button>
        <button className="nav-tab" onClick={() => navigate("/record")}>
          Ghi chép
        </button>
        <button className="nav-tab momo-pink active">Chat</button>
      </div>

      <div className="chat-container-wrapper">
        <div className="chat-container">
          <div className="chat-header-section">
            <h2 className="chat-title">Chatbot</h2>
            <p className="chat-prompt">
              Hỏi bất cứ điều gì về giao dịch của bạn. e.g., "Tổng chi tiêu tuần trước là bao nhiêu?"
            </p>
            {messages.length > 1 && (
              <span className="chat-clear-btn" onClick={clearChatHistory}>
                Xóa lịch sử trò chuyện
              </span>
            )}
          </div>

          <div className="chat-messages" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`chat-message ${m.role}`}>
                <div className="chat-message-icon">
                  {m.role === "assistant" ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <div className={`chat-bubble ${m.role}`}>
                  <div className="chat-message-text">{m.content}</div>

                  {m.role === "assistant" && m.transactions && m.transactions.length > 0 && (
                    <div className="chat-transaction-panel-inline">
                      {m.transactions.map((transaction) => {
                        const categoryInfo = getCategoryInfo(transaction.category);
                        return (
                          <div
                            key={transaction._id ?? `${transaction.description}-${transaction.paid_at}`}
                            className={`chat-transaction-card-inline${
                              transaction.panelSource === "delete" ? " deleted" : ""
                            }`}
                          >
                            <div className="chat-transaction-card-header-inline">
                              <div className="chat-transaction-name-inline">{transaction.description}</div>
                              <div className="chat-transaction-amount-inline">
                                -{formatCurrency(transaction.price)}
                              </div>
                            </div>

                            <div className="chat-transaction-meta-inline">
                              <div className="chat-transaction-status-inline">
                                  <div
                                    className={`chat-transaction-status-icon-inline ${getPanelStatusClass(
                                      transaction
                                    )}`}
                                  >
                                    ✓
                                  </div>
                                  <span className="chat-transaction-status-text-inline">
                                    {getPanelStatusText(transaction)}
                                  </span>
                                <span className="chat-transaction-separator-inline">•</span>
                                <span className="chat-transaction-time-inline">
                                  {formatDateTime(transaction.paid_at)}
                                </span>
                              </div>
                            </div>

                            <div className="chat-transaction-footer-inline">
                              {transaction._id && editingCategory[transaction._id] ? (
                                <select
                                  className="chat-transaction-category-select-inline"
                                  value={transaction.category ?? "none"}
                                  onChange={(e) =>
                                    handleCategoryChange(transaction._id!, e.target.value, m.id)
                                  }
                                  onBlur={() =>
                                    setEditingCategory((prev) => {
                                      const next = { ...prev };
                                      delete next[transaction._id!];
                                      return next;
                                    })
                                  }
                                  autoFocus
                                >
                                  {CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div
                                  className="chat-transaction-category-inline"
                                  onClick={() =>
                                    transaction._id &&
                                    setEditingCategory((prev) => ({
                                      ...prev,
                                      [transaction._id!]: transaction.category ?? "none",
                                    }))
                                  }
                                >
                                  <span className="chat-transaction-category-icon-inline">
                                    {categoryInfo.icon}
                                  </span>
                                  <span className="chat-transaction-category-text-inline">
                                    {categoryInfo.label}
                                  </span>
                                </div>
                              )}

                              {transaction._id && (
                                <button
                                  className="chat-transaction-edit-btn-inline"
                                  onClick={() =>
                                    setEditingCategory((prev) => ({
                                      ...prev,
                                      [transaction._id!]: transaction.category ?? "none",
                                    }))
                                  }
                                  title="Sửa danh mục"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message assistant">
                <div className="chat-message-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className="chat-bubble assistant">Đang suy nghĩ...</div>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
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
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}