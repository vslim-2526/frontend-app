import { useEffect, useMemo, useState } from "react";
import { apiGet, apiDelete} from "../lib/api"; // ✅ Thêm apiDelete, apiPut
import type { Expense, ExpensesResponse } from "../lib/types";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'; // ✅ Nếu dùng recharts

// ✅ Thêm CATEGORIES constant để map category value sang label
const CATEGORIES = [
  { value: "FOOD", label: "Ăn uống" },
  { value: "APPLIANCES", label: "Mua sắm" },
  { value: "TRANSPORT", label: "Giao thông" },
  { value: "HEALTH", label: "Sức khỏe" },
  { value: "BILLS", label: "Hóa đơn" },
  { value: "none", label: "Khác" },
];

export default function Home() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ State để quản lý popup
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Tính toán tháng hiện tại (start và end)
  const monthStart = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1);
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0, 23, 59, 59);
  }, [currentDate]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const paidAfter = monthStart.toISOString().split('T')[0];
        const paidBefore = monthEnd.toISOString().split('T')[0];

        // Fetch expenses cho tháng hiện tại
        const expensesRes = await apiGet<ExpensesResponse>(
          `/v1/expense/many?paid_after=${paidAfter}&paid_before=${paidBefore}`
        );
        setExpenses(expensesRes.result || []);

        // Fetch statistics cho tháng hiện tại
        // const statsRes = await apiGet<StatisticsResponse>(
        //   `/v1/statistics?paid_after=${paidAfter}&paid_before=${paidBefore}`
        // );
        // setStatistics(statsRes || {});
      } catch (error) {
        console.error("Error fetching data:", error);
        // ✅ Thêm dòng này để set empty data khi API fail
        setExpenses([]);
        // setStatistics({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [monthStart, monthEnd]);

  // Tính toán summary - Chỉ tính expense
  const summary = useMemo(() => {
    const totalExpenses = expenses
      .filter(e => e.type === "expense")
      .reduce((sum, e) => {
        // ✅ Convert price sang number, đảm bảo là số hợp lệ
        const price = Number(e.price) || 0;
        return sum + price;
      }, 0);
    
    return { totalExpenses };
  }, [expenses]);

  // Lấy transactions cho tháng hiện tại
  const monthTransactions = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.paid_at);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      })
      .sort((a, b) => {
        // ✅ Sắp xếp theo ngày (paid_at) - ngày mới nhất trước
        const aPaidDate = new Date(a.paid_at);
        const bPaidDate = new Date(b.paid_at);
        
        // So sánh ngày (chỉ lấy YYYY-MM-DD, bỏ qua giờ phút giây)
        const aDateStr = `${aPaidDate.getFullYear()}-${String(aPaidDate.getMonth() + 1).padStart(2, '0')}-${String(aPaidDate.getDate()).padStart(2, '0')}`;
        const bDateStr = `${bPaidDate.getFullYear()}-${String(bPaidDate.getMonth() + 1).padStart(2, '0')}-${String(bPaidDate.getDate()).padStart(2, '0')}`;
        
        // Nếu khác ngày, sắp xếp theo ngày (mới nhất trước)
        if (aDateStr !== bDateStr) {
          return bPaidDate.getTime() - aPaidDate.getTime();
        }
        
        // Nếu cùng ngày, sắp xếp theo created_at (mới nhất trước)
        const aCreatedTime = a.created_at 
          ? new Date(a.created_at).getTime() 
          : 0;
        const bCreatedTime = b.created_at 
          ? new Date(b.created_at).getTime() 
          : 0;
        
        return bCreatedTime - aCreatedTime;
      });
  }, [expenses, currentDate]);

  // Function để format số tiền compact (k, tr) - loại bỏ .0
  const formatCompactAmount = (amount: number): string => {
    if (amount >= 1000000) {
      const tr = amount / 1000000;
      const formatted = tr % 1 === 0 ? tr.toString() : tr.toFixed(1);
      return `${formatted}tr`;
    } else if (amount >= 1000) {
      const k = amount / 1000;
      const formatted = k % 1 === 0 ? k.toString() : k.toFixed(1);
      return `${formatted}k`;
    } else {
      return `${amount}₫`;
    }
  };

  // Calendar helpers - Cập nhật để tính tổng expense
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Convert to Monday = 0 format
    const startOffset = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    const days: Array<{ 
      date: Date; 
      isCurrentMonth: boolean; 
      totalExpense: number; 
    }> = [];
    
    // ✅ Helper function để format date thành YYYY-MM-DD theo local timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // ✅ Helper function để tính tổng expense cho một ngày (dùng local date)
    const calculateDayExpense = (dateStr: string): number => {
      const dayExpenses = expenses.filter(e => {
        if (e.type !== "expense") return false;
        // ✅ Convert paid_at sang local date string (không dùng UTC)
        const expenseDate = new Date(e.paid_at);
        const expenseDateStr = formatLocalDate(expenseDate);
        return expenseDateStr === dateStr;
      });
      
      return dayExpenses.reduce((sum, e) => {
        const price = typeof e.price === 'string' ? parseFloat(e.price) : (e.price || 0);
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
    };
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = formatLocalDate(date); // ✅ Dùng local date
      const totalExpense = calculateDayExpense(dateStr);
      days.push({
        date,
        isCurrentMonth: false,
        totalExpense,
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatLocalDate(date); // ✅ Dùng local date
      const totalExpense = calculateDayExpense(dateStr);
      days.push({
        date,
        isCurrentMonth: true,
        totalExpense,
      });
    }
    
    // Fill remaining days to complete 6 weeks
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateStr = formatLocalDate(date); // ✅ Dùng local date
      const totalExpense = calculateDayExpense(dateStr);
      days.push({
        date,
        isCurrentMonth: false,
        totalExpense,
      });
    }
    
    return days;
  }, [currentDate, expenses]);

  // ✅ Helper function để format date thành YYYY-MM-DD theo local timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ✅ Lấy giao dịch cho ngày được chọn
  const dayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateStr = formatLocalDate(selectedDate);
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.paid_at);
        const expenseDateStr = formatLocalDate(expenseDate);
        return expenseDateStr === dateStr;
      })
      .sort((a, b) => {
        // Sort theo created_at (mới nhất trước)
        const aTime = a.created_at 
          ? new Date(a.created_at).getTime() 
          : new Date(a.paid_at).getTime();
        const bTime = b.created_at 
          ? new Date(b.created_at).getTime() 
          : new Date(b.paid_at).getTime();
        return bTime - aTime;
      });
  }, [expenses, selectedDate]);

  // ✅ Tính tổng chi tiêu cho ngày được chọn
  const dayTotalExpense = useMemo(() => {
    return dayTransactions
      .filter(e => e.type === "expense")
      .reduce((sum, e) => sum + (Number(e.price) || 0), 0);
  }, [dayTransactions]);

  // ✅ Function để mở popup khi click vào ô lịch
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  // ✅ Function để đóng popup
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  // ✅ Function để get category label từ value
  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  // Format month title như MoMo: "Tháng 10/2025"
  const formatMonthTitle = (date: Date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `Tháng ${month}/${year}`;
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const formatCurrency = (amount: number) => {
    // ✅ Format với dấu phẩy, làm tròn số
    const rounded = Math.round(amount);
    return `${rounded.toLocaleString("en-US")} ₫`;
  };

  const formatDate = (date: Date) => {
    const d = date.getDate();
    const m = date.getMonth() + 1;
    const y = date.getFullYear();
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  };

  // Thêm function để format tháng
  const formatMonth = (date: Date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `Tháng ${month}/${year}`;
  };

  // ✅ Thêm function xóa giao dịch
  const handleDelete = async (transactionId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) {
      return;
    }

    try {
      await apiDelete("/v1/expense", {
        deleted_ids: [transactionId]
      });
      
      // Refresh data sau khi xóa
      const paidAfter = monthStart.toISOString().split('T')[0];
      const paidBefore = monthEnd.toISOString().split('T')[0];
      
      const expensesRes = await apiGet<ExpensesResponse>(
        `/v1/expense/many?paid_after=${paidAfter}&paid_before=${paidBefore}`
      );
      setExpenses(expensesRes.result || []);
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Không thể xóa giao dịch. Vui lòng thử lại.");
    }
  };

  // ✅ Thêm function sửa giao dịch
  const handleEdit = (transaction: Expense) => {
    navigate("/record", { 
      state: { 
        transaction: transaction
      } 
    });
  };

  // ✅ Helper function để lấy màu cho category - DI CHUYỂN LÊN TRƯỚC
  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      FOOD: "#FF6B6B",
      APPLIANCES: "#4ECDC4",
      TRANSPORT: "#45B7D1",
      HEALTH: "#96CEB4",
      BILLS: "#FFEAA7",
      none: "#DDA0DD",
    };
    return colors[category] || "#95A5A6";
  };

  // ✅ Tính toán statistics theo category
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number }> = {};
    
    expenses
      .filter(e => e.type === "expense")
      .forEach(e => {
        const category = e.category || "none";
        const price = Number(e.price) || 0;
        
        if (!stats[category]) {
          stats[category] = { total: 0, count: 0 };
        }
        stats[category].total += price;
        stats[category].count += 1;
      });
    
    return stats;
  }, [expenses]);

  // ✅ Format data cho pie chart - SAU getCategoryColor
  const pieChartData = useMemo(() => {
    return Object.entries(categoryStats)
      .map(([category, data]) => {
        const categoryInfo = CATEGORIES.find(c => c.value === category);
        return {
          name: categoryInfo ? categoryInfo.label : category,
          value: data.total,
          count: data.count,
          color: getCategoryColor(category), // ✅ Bây giờ getCategoryColor đã được định nghĩa
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [categoryStats]);

  if (loading) {
    return <div className="page">Loading...</div>;
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
        <button className="nav-tab active">Lịch</button>
        <button 
          className="nav-tab" 
          onClick={() => navigate("/record")}
        >
          Ghi chép
        </button>
        <button 
          className="nav-tab momo-pink" 
          onClick={() => navigate("/chat")}
        >
          Chat
        </button>
      </div>

      {/* Summary Cards - Tổng chi tiêu và Thống kê */}
      <div className="summary-cards">
        {/* Card Tổng chi tiêu - Rút ngắn lại */}
        <div className="summary-card expense-card summary-card-compact">
          <div className="card-icon expense-icon">↓</div>
          <div className="card-content">
            <div className="card-title">Tổng chi tiêu</div>
            <div className="card-amount expense-amount">{formatCurrency(summary.totalExpenses)}</div>
            <div className="card-subtitle">Tháng này</div>
          </div>
        </div>

        {/* Card Thống kê - Mới */}
        <div className="summary-card statistics-card">
          <div className="statistics-content">
            {/* Danh sách categories bên trái */}
            <div className="statistics-list">
              <div className="statistics-title">Chi tiêu theo danh mục</div>
              <div className="category-stats-list">
                {pieChartData.map((item, index) => (
                  <div key={index} className="category-stat-item">
                    <div className="category-stat-info">
                      <div 
                        className="category-stat-color" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="category-stat-name">{item.name}</span>
                      <span className="category-stat-count">({item.count})</span>
                    </div>
                    <span className="category-stat-amount">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                {pieChartData.length === 0 && (
                  <div className="no-statistics">Chưa có dữ liệu</div>
                )}
              </div>
            </div>

            {/* Pie chart bên phải */}
            <div className="statistics-chart">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}> {/* ✅ Giảm từ 200 xuống 150 */}
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      // label={({ name, percent }) => {
                      //   // ✅ Thêm null check cho percent
                      //   if (percent === undefined) return name;
                      //   return `${name}: ${(percent * 100).toFixed(0)}%`;
                      // }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    {/* <Legend /> */}
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-chart-data">Chưa có dữ liệu</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="home-content-grid">
        {/* Calendar Section */}
        <div className="calendar-section">
          <div className="calendar-header">
            <button className="calendar-nav" onClick={() => navigateMonth(-1)}>←</button>
            <h2 className="calendar-month">
              {formatMonthTitle(currentDate)}
            </h2>
            <button className="calendar-nav" onClick={() => navigateMonth(1)}>→</button>
          </div>
          
          <div className="calendar-weekdays">
            <div className="weekday">Th 2</div>
            <div className="weekday">Th 3</div>
            <div className="weekday">Th 4</div>
            <div className="weekday">Th 5</div>
            <div className="weekday">Th 6</div>
            <div className="weekday">Th 7</div>
            <div className="weekday">CN</div>
          </div>

          <div className="calendar-days">
            {calendarDays.map((day, idx) => (
              <div
                key={idx}
                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.totalExpense > 0 ? 'has-expense' : ''}`}
                onClick={() => handleDayClick(day.date)} // ✅ Đổi từ setCurrentDate sang handleDayClick
              >
                <div className="calendar-day-number">{day.date.getDate()}</div>
                {day.totalExpense > 0 && day.isCurrentMonth && (
                  <div className="calendar-day-amount">{formatCompactAmount(day.totalExpense)}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="transactions-section">
          <h3 className="transactions-header">
            Giao dịch của {formatMonth(currentDate)}
          </h3>
          <div className="transactions-list">
            {monthTransactions.length === 0 ? (
              <div className="no-transactions">Không có giao dịch nào</div>
            ) : (
              monthTransactions.map((transaction) => (
                <div key={transaction._id || `transaction-${transaction.paid_at}`} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-name">{transaction.description}</div>
                    <div className="transaction-meta">
                      <span className="transaction-category">
                        {getCategoryLabel(transaction.category || "none")}
                      </span>
                      <span className="transaction-date">{formatDate(new Date(transaction.paid_at))}</span>
                      {/* ✅ Thêm buttons Sửa và Xóa bên phải ngày tháng */}
                      <div className="transaction-actions">
                        <button 
                          className="transaction-action-btn edit-btn"
                          onClick={() => handleEdit(transaction)}
                          title="Sửa"
                        >
                          ✏️
                        </button>
                        <button 
                          className="transaction-action-btn delete-btn"
                          onClick={() => transaction._id && handleDelete(transaction._id)}
                          title="Xóa"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={`transaction-amount ${transaction.type === "income" ? "income" : "expense"}`}>
                    {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.price)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ✅ Modal/Popup hiển thị giao dịch trong ngày */}
      {showModal && selectedDate && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Giao dịch ngày {formatDate(selectedDate)}
              </h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {dayTransactions.length === 0 ? (
                <div className="no-transactions">Không có giao dịch nào trong ngày này</div>
              ) : (
                <>
                  {dayTotalExpense > 0 && (
                    <div className="modal-summary">
                      <span className="modal-summary-label">Tổng chi tiêu:</span>
                      <span className="modal-summary-amount">{formatCurrency(dayTotalExpense)}</span>
                    </div>
                  )}
                  
                  <div className="modal-transactions-list">
                    {dayTransactions.map((transaction) => (
                      <div key={transaction._id || `transaction-${transaction.paid_at}`} className="modal-transaction-item">
                        <div className="modal-transaction-info">
                          <div className="modal-transaction-name">{transaction.description}</div>
                          <div className="modal-transaction-meta">
                            <span className="modal-transaction-category">
                              {getCategoryLabel(transaction.category || "none")}
                            </span>
                            <div className="modal-transaction-actions">
                              <button 
                                className="modal-transaction-action-btn edit-btn"
                                onClick={() => {
                                  handleEdit(transaction);
                                  handleCloseModal();
                                }}
                                title="Sửa"
                              >
                                ✏️
                              </button>
                              <button 
                                className="modal-transaction-action-btn delete-btn"
                                onClick={() => {
                                  if (transaction._id) {
                                    handleDelete(transaction._id);
                                  }
                                }}
                                title="Xóa"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className={`modal-transaction-amount ${transaction.type === "income" ? "income" : "expense"}`}>
                          {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.price)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}