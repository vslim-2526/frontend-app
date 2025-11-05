import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import type { Expense } from "../lib/types";

export default function Record() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    paid_at: new Date().toISOString().split('T')[0],
    category: "FOOD",
    type: "income" as "expense" | "income",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: "FOOD", label: "Food" },
    { value: "APPLIANCES", label: "Appliances" },
    { value: "TRANSPORT", label: "Transport" },
    { value: "HEALTH", label: "Health" },
    { value: "BILLS", label: "Bills" },
    { value: "Salary", label: "Salary" },
    { value: "Other", label: "Other" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleTypeChange = (type: "expense" | "income") => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Lấy user_id từ context/auth, tạm thời hardcode
      const user_id = "65f1234567890abcdef12345"; // Thay bằng user_id thực tế

      const expenseData: Expense = {
        user_id,
        type: formData.type,
        description: formData.description,
        amount: formData.amount,
        category: formData.category,
        paid_at: new Date(formData.paid_at).toISOString(),
      };

      await apiPost("/v1/expense", [expenseData]);
      
      setSuccess(true);
      // Reset form sau 2 giây
      setTimeout(() => {
        setFormData({
          description: "",
          amount: 0,
          paid_at: new Date().toISOString().split('T')[0],
          category: "FOOD",
          type: "income",
        });
        setSuccess(false);
        // Optionally navigate to home
        // navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Error creating expense:", err);
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra khi thêm giao dịch");
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('vi-VN', options);
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
          className="nav-tab" 
          onClick={() => navigate("/chat")}
        >
          Chat
        </button>
      </div>

      {/* Form Section */}
      <div className="record-form-container">
        <div className="record-form-card">
          <h2 className="record-form-title">Ghi chép giao dịch mới</h2>
          <p className="record-form-subtitle">
            Thêm một khoản thu nhập hoặc chi tiêu mới vào sổ của bạn.
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
              <label htmlFor="amount" className="form-label">Số tiền</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="form-input"
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
                <span className="form-input-date-display">
                  {formatDateForDisplay(formData.paid_at)}
                </span>
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

            {/* Loại giao dịch */}
            <div className="form-group">
              <label className="form-label">Loại giao dịch</label>
              <div className="form-radio-group">
                <label className={`form-radio ${formData.type === "income" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="type"
                    value="income"
                    checked={formData.type === "income"}
                    onChange={() => handleTypeChange("income")}
                    className="form-radio-input"
                  />
                  <span className="form-radio-label">Thu nhập</span>
                </label>
                <label className={`form-radio ${formData.type === "expense" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="type"
                    value="expense"
                    checked={formData.type === "expense"}
                    onChange={() => handleTypeChange("expense")}
                    className="form-radio-input"
                  />
                  <span className="form-radio-label">Chi tiêu</span>
                </label>
              </div>
            </div>

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
              {loading ? "Đang thêm..." : "Thêm giao dịch"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
