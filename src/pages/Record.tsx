import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiPost, apiPut } from "../lib/api";
import type { Expense } from "../lib/types";

export default function Record() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Đọc query param để kiểm tra chế độ update
  const searchParams = new URLSearchParams(location.search);
  const isUpdateMode = searchParams.get('mode') === 'update';
  
  // Lấy transaction từ state nếu có (khi edit)
  const editingTransaction = location.state?.transaction as Expense | undefined;

  const [formData, setFormData] = useState({
    description: editingTransaction?.description || "",
    price: editingTransaction?.price || 0, // ✅ Đổi từ amount sang price
    paid_at: editingTransaction?.paid_at 
      ? new Date(editingTransaction.paid_at).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    category: editingTransaction?.category || "FOOD",
    type: "expense" as "expense" | "income",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ✅ Đổi displayAmount thành displayPrice (hoặc giữ tên displayAmount nhưng dùng cho price)
  const [displayPrice, setDisplayPrice] = useState("");

  // const categories = [
  //   { value: "FOOD", label: "Food" },
  //   { value: "APPLIANCES", label: "Appliances" },
  //   { value: "TRANSPORT", label: "Transport" },
  //   { value: "HEALTH", label: "Health" },
  //   { value: "BILLS", label: "Bills" },
  //   { value: "Salary", label: "Salary" },
  //   { value: "Other", label: "Other" },
  // ];

  const categories = [
    { value: "FOOD", label: "Ăn uống", icon: "🍽️" },
    { value: "APPLIANCES", label: "Mua sắm", icon: "🛒" },
    { value: "TRANSPORT", label: "Đi lại", icon: "🚗" },
    { value: "HEALTH", label: "Sức khỏe", icon: "🏥" },
    { value: "BILLS", label: "Hóa đơn", icon: "📄" }, 
    { value: "none", label: "Khác", icon: "📦" },
  ];

  // ✅ Function format số với dấu phẩy
  const formatNumberWithCommas = (value: string | number): string => {
    // Bỏ tất cả ký tự không phải số
    const numStr = value.toString().replace(/[^\d]/g, "");
    if (!numStr) return "";
    
    // Convert sang number và format lại
    const num = parseInt(numStr, 10);
    if (isNaN(num)) return "";
    
    return num.toLocaleString("en-US");
  };

  // ✅ Function parse số từ string có dấu phẩy
  const parseNumberFromFormatted = (value: string): number => {
    const numStr = value.replace(/,/g, "");
    return parseFloat(numStr) || 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "price") { // ✅ Đổi từ "amount" sang "price"
      const formatted = formatNumberWithCommas(value);
      setDisplayPrice(formatted); // ✅ Đổi từ displayAmount sang displayPrice
      
      const numericValue = parseNumberFromFormatted(formatted);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // ✅ Sync displayAmount khi editingTransaction thay đổi
  useEffect(() => {
    if (editingTransaction) {
      const price = editingTransaction.price || 0; // ✅ Chỉ dùng price
      setDisplayPrice(formatNumberWithCommas(price)); // ✅ Đổi từ displayAmount sang displayPrice
    } else {
      setDisplayPrice("");
    }
  }, [editingTransaction]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ✅ Đổi tên function thành handlePriceChange hoặc giữ tên nhưng đổi logic
    let value = e.target.value;
    value = value.replace(/[^\d,]/g, "");
    
    const numStr = value.replace(/,/g, "");
    if (numStr === "") {
      setDisplayPrice(""); // ✅ Đổi từ displayAmount sang displayPrice
      setFormData(prev => ({ ...prev, price: 0 })); // ✅ Đổi từ amount sang price
      return;
    }
    
    const num = parseInt(numStr, 10);
    if (!isNaN(num)) {
      const formatted = num.toLocaleString("en-US");
      setDisplayPrice(formatted); // ✅ Đổi từ displayAmount sang displayPrice
      setFormData(prev => ({ ...prev, price: num })); // ✅ Đổi từ amount sang price
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // ✅ Thay đổi user_id thành user_id hợp lệ từ AWS backend
      const user_id = "68b3d1ae0be9bb8228499d9f"; // User ID từ Postman collection

      const expenseData = {
        user_id,
        type: "expense",
        description: formData.description,
        price: Number(formData.price) || 0, // ✅ Đổi từ formData.amount sang formData.price
        category: formData.category,
        paid_at: new Date(formData.paid_at).toISOString(),
      };

      if (expenseData.price <= 0) {
        setError("Số tiền phải lớn hơn 0");
        setLoading(false);
        return;
      }

      if (editingTransaction?._id) {
        await apiPut("/v1/expense", [{
          ...expenseData,
          _id: editingTransaction._id,
          created_at: editingTransaction.created_at,
        }]);
        setSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        await apiPost("/v1/expense", [expenseData]);
        setSuccess(true);
        setTimeout(() => {
          setFormData({
            description: "",
            price: 0,
            paid_at: new Date().toISOString().split('T')[0],
            category: "FOOD",
            type: "expense",
          });
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Error creating/updating expense:", err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : (isUpdateMode ? "Có lỗi xảy ra khi sửa giao dịch" : "Có lỗi xảy ra khi thêm giao dịch");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

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
        <button className="nav-tab active">Ghi chép</button>
        <button 
          className="nav-tab momo-pink" 
          onClick={() => navigate("/chat")}
        >
          Chat
        </button>
      </div>

      {/* Form Section */}
      <div className="record-form-container">
        <div className="record-form-card">
          <h2 className="record-form-title">
            {editingTransaction ? "Sửa giao dịch" : "Ghi chép giao dịch mới"}
          </h2>
          <p className="record-form-subtitle">
            Thêm một khoản chi tiêu mới vào sổ của bạn. {/* ✅ Đổi text */}
          </p>

          <form onSubmit={handleSubmit} className="record-form">
            {/* Mô tả */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">Mô tả</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Coffee with friends"
                className="form-input"
                required
              />
            </div>

            {/* Số tiền */}
            <div className="form-group">
              <label htmlFor="price" className="form-label">Số tiền</label>
              <input
                type="text"
                id="price"
                name="price"
                value={displayPrice}
                onChange={handleAmountChange}
                placeholder="0"
                className="form-input"
                inputMode="numeric"
                required
              />
            </div>

            {/* Ngày giao dịch */}
            <div className="form-group">
              <label htmlFor="paid_at" className="form-label">Ngày giao dịch</label>
              <div className="form-input-wrapper">
                <input
                  type="date"
                  id="paid_at"
                  name="paid_at"
                  value={formatDateForInput(formData.paid_at)}
                  onChange={handleChange}
                  className="form-input form-input-date"
                  required
                />
              </div>
            </div>

            {/* Hạng mục */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">Hạng mục</label>
              <div className="form-select-wrapper">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-input form-select"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <span className="form-select-arrow">▼</span>
              </div>
            </div>

            {/* ✅ BỎ phần "Loại giao dịch" - không cần radio buttons nữa */}

            {/* Error Message */}
            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="form-success">
                ✓ Giao dịch đã được thêm thành công!
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="form-submit-btn"
              disabled={loading}
            >
              {loading 
                ? (isUpdateMode ? "Đang sửa..." : "Đang thêm...") 
                : (isUpdateMode ? "Sửa giao dịch" : "Thêm giao dịch")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
