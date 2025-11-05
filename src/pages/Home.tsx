import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../lib/api";
import type { Expense, ExpensesResponse, StatisticsResponse } from "../lib/types";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [statistics, setStatistics] = useState<StatisticsResponse>({});
  const [loading, setLoading] = useState(true);

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
        const statsRes = await apiGet<StatisticsResponse>(
          `/v1/statistics?paid_after=${paidAfter}&paid_before=${paidBefore}`
        );
        setStatistics(statsRes || {});
      } catch (error) {
        console.error("Error fetching data:", error);
        // ✅ Thêm dòng này để set empty data khi API fail
        setExpenses([]);
        setStatistics({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [monthStart, monthEnd]);

  // Tính toán summary
  const summary = useMemo(() => {
    const totalIncome = expenses
      .filter(e => e.type === "income")
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const totalExpenses = expenses
      .filter(e => e.type === "expense")
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const balance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, balance };
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
        // Sort theo ngày, mới nhất trước
        return new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime();
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
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.paid_at).toISOString().split('T')[0];
        return expenseDate === dateStr && e.type === "expense";
      });
      const totalExpense = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      days.push({
        date,
        isCurrentMonth: false,
        totalExpense,
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.paid_at).toISOString().split('T')[0];
        return expenseDate === dateStr && e.type === "expense";
      });
      const totalExpense = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
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
      const dateStr = date.toISOString().split('T')[0];
      const dayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.paid_at).toISOString().split('T')[0];
        return expenseDate === dateStr && e.type === "expense";
      });
      const totalExpense = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      days.push({
        date,
        isCurrentMonth: false,
        totalExpense,
      });
    }
    
    return days;
  }, [currentDate, expenses]);

  const monthNames = [
    "Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu",
    "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"
  ];

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
    return `${amount.toLocaleString("vi-VN")} ₫`;
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
          className="nav-tab" 
          onClick={() => navigate("/chat")}
        >
          Chat
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card income-card">
          <div className="card-icon income-icon">↑</div>
          <div className="card-content">
            <div className="card-title">Tổng thu nhập</div>
            <div className="card-amount income-amount">{formatCurrency(summary.totalIncome)}</div>
            <div className="card-subtitle">Tháng này</div>
          </div>
        </div>

        <div className="summary-card expense-card">
          <div className="card-icon expense-icon">↓</div>
          <div className="card-content">
            <div className="card-title">Tổng chi tiêu</div>
            <div className="card-amount expense-amount">{formatCurrency(summary.totalExpenses)}</div>
            <div className="card-subtitle">Tháng này</div>
          </div>
        </div>

        <div className="summary-card balance-card">
          <div className="card-icon balance-icon">⚖</div>
          <div className="card-content">
            <div className="card-title">Số dư</div>
            <div className="card-amount balance-amount">{formatCurrency(summary.balance)}</div>
            <div className="card-subtitle">Chênh lệch thu - chi</div>
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
                onClick={() => setCurrentDate(day.date)}
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
                      <span className="transaction-category">{transaction.category}</span>
                      <span className="transaction-date">{formatDate(new Date(transaction.paid_at))}</span>
                    </div>
                  </div>
                  <div className={`transaction-amount ${transaction.type === "income" ? "income" : "expense"}`}>
                    {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}