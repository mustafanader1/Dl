export type Priority = 'high' | 'medium' | 'low';
export type DebtStatus = 'unpaid' | 'partial' | 'paid';

export interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Debt {
  id: string;
  debtorName: string;
  amount: number;
  paidAmount: number;
  currency: string;
  dueDate: string;
  priority: Priority;
  status: DebtStatus;
  description?: string;
  phone?: string;
  telegramUsername?: string;
  createdAt: string;
  history: PaymentHistory[];
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface AppStats {
  totalDebts: number;
  totalPaid: number;
  totalRemaining: number;
  unpaidCount: number;
  partialCount: number;
  paidCount: number;
}
