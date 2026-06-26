export type DebtStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'SETTLED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  profilePictureUrl?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  creatorId: string;
  debtorId: string;
  creditorId: string;
  amount: number;
  currency: string; // 'USD', 'EUR', 'GBP', etc.
  description: string;
  attachmentUrl?: string;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
  
  // Custom ui fields (joined or populated)
  counterpartyName: string;
  isIowed: boolean;
}

export interface BalanceSummary {
  currency: string;
  netAmount: number; // Positive means user is owed, negative means user owes
  totalOwedToMe: number;
  totalIOwe: number;
}

export interface DashboardData {
  balances: BalanceSummary[];
  pendingCount: number;
  recentActivities: Debt[];
}
