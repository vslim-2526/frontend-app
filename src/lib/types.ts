export type Expense = {
  _id?: string;
  user_id?: string;
  type: "expense" | "income";
  description: string;
  price: number; // ✅ Đổi từ amount sang price
  category: string;
  paid_at: string; // ISO date string
  created_at?: string;
  modified_at?: string;
};

export type ExpensesResponse = {
  result: Expense[];
};

export type StatisticsResponse = {
  [category: string]: {
    totalAmount: number;
    count: number;
  };
};