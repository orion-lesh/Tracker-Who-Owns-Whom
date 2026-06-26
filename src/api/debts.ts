import { DashboardData, Debt, User, DebtStatus } from "../types";

// Dynamic In-Memory Database
export const MOCK_USERS: User[] = [
  {
    id: "user-current",
    email: "john.doe@example.com",
    displayName: "John Doe",
    profilePictureUrl: undefined,
    createdAt: "2026-06-20T10:00:00Z",
  },
  {
    id: "user-2",
    email: "alex.rivera@example.com",
    displayName: "Alex Rivera",
    profilePictureUrl: undefined,
    createdAt: "2026-06-20T11:00:00Z",
  },
  {
    id: "user-3",
    email: "chloe.chen@example.com",
    displayName: "Chloe Chen",
    profilePictureUrl: undefined,
    createdAt: "2026-06-20T12:00:00Z",
  },
  {
    id: "user-4",
    email: "marcus.vance@example.com",
    displayName: "Marcus Vance",
    profilePictureUrl: undefined,
    createdAt: "2026-06-20T13:00:00Z",
  },
];

// Active user tracking
let activeUserId = "user-current";

export const getActiveUser = (): User => {
  return MOCK_USERS.find((u) => u.id === activeUserId) || MOCK_USERS[0];
};

export const setActiveUser = (userId: string): void => {
  activeUserId = userId;
};

// Database-like structure for debts
interface DbDebt {
  id: string;
  creatorId: string;
  debtorId: string;
  creditorId: string;
  amount: number;
  currency: string;
  description: string;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
  attachmentUrl?: string;
}

// Initial mock debts in raw DB format
let dbDebts: DbDebt[] = [
  {
    id: "debt-1",
    creatorId: "user-2", // created by Alex
    debtorId: "user-current", // debtor is John
    creditorId: "user-2", // creditor is Alex
    amount: 25.00,
    currency: "USD",
    description: "Shared Uber ride home",
    status: "PENDING_APPROVAL",
    createdAt: "2026-06-23T22:15:00Z",
    updatedAt: "2026-06-23T22:15:00Z",
  },
  {
    id: "debt-2",
    creatorId: "user-current", // created by John
    debtorId: "user-3", // debtor is Chloe
    creditorId: "user-current", // creditor is John
    amount: 120.00,
    currency: "USD",
    description: "Coachella Ticket Deposit",
    status: "ACTIVE",
    createdAt: "2026-06-22T14:30:00Z",
    updatedAt: "2026-06-23T09:00:00Z",
  },
  {
    id: "debt-3",
    creatorId: "user-current", // created by John
    debtorId: "user-current", // debtor is John
    creditorId: "user-2", // creditor is Alex
    amount: 60.50,
    currency: "EUR",
    description: "Dinner at Bistro",
    status: "ACTIVE",
    createdAt: "2026-06-20T20:45:00Z",
    updatedAt: "2026-06-21T11:00:00Z",
  },
  {
    id: "debt-4",
    creatorId: "user-current", // created by John
    debtorId: "user-4", // debtor is Marcus
    creditorId: "user-current", // creditor is John
    amount: 100.00,
    currency: "USD",
    description: "Lent cash for concert ticket",
    status: "PENDING_APPROVAL",
    createdAt: "2026-06-23T18:00:00Z",
    updatedAt: "2026-06-23T18:00:00Z",
  },
];

// Helper to map DB debt format to UI format for the active user
const mapDbDebtToUi = (dbDebt: DbDebt, currentUserId: string): Debt => {
  const isCreditor = dbDebt.creditorId === currentUserId;
  const counterpartyId = isCreditor ? dbDebt.debtorId : dbDebt.creditorId;
  const counterparty = MOCK_USERS.find((u) => u.id === counterpartyId);
  const counterpartyName = counterparty ? counterparty.displayName : "Unknown User";

  return {
    ...dbDebt,
    counterpartyName,
    isIowed: isCreditor,
  };
};

export const getDashboardSummary = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const currentUserId = activeUserId;
      
      // Filter debts relevant to the active user (creditor or debtor)
      const userDbDebts = dbDebts.filter(
        (d) => d.debtorId === currentUserId || d.creditorId === currentUserId
      );

      // Map to UI debts
      const recentActivities = userDbDebts
        .map((d) => mapDbDebtToUi(d, currentUserId))
        // Sort descending by creation date
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Get pending approvals where the active user is NOT the creator
      // (meaning they are the counterparty who needs to confirm/approve it)
      const pendingCount = userDbDebts.filter(
        (d) => d.status === "PENDING_APPROVAL" && d.creatorId !== currentUserId
      ).length;

      // Calculate balances grouped by currency
      const currencyBalances: {
        [currency: string]: { totalOwedToMe: number; totalIOwe: number };
      } = {};

      userDbDebts.forEach((d) => {
        // Only ACTIVE and SETTLED affect balances? Wait, context says:
        // "Until confirmed, the debt is not calculated into the cumulative net balance of either user."
        // And SETTLED debts are paid off, so they shouldn't count towards active balances either.
        // Therefore, only ACTIVE status affects the balance!
        if (d.status === "ACTIVE") {
          if (!currencyBalances[d.currency]) {
            currencyBalances[d.currency] = { totalOwedToMe: 0, totalIOwe: 0 };
          }
          if (d.creditorId === currentUserId) {
            currencyBalances[d.currency].totalOwedToMe += d.amount;
          } else if (d.debtorId === currentUserId) {
            currencyBalances[d.currency].totalIOwe += d.amount;
          }
        }
      });

      // Format balances array
      const balances = Object.keys(currencyBalances).map((curr) => {
        const { totalOwedToMe, totalIOwe } = currencyBalances[curr];
        return {
          currency: curr,
          netAmount: totalOwedToMe - totalIOwe,
          totalOwedToMe,
          totalIOwe,
        };
      });

      // Ensure we always return at least the primary currencies even if empty balances
      const requiredCurrencies = ["USD", "EUR"];
      requiredCurrencies.forEach((curr) => {
        if (!balances.some((b) => b.currency === curr)) {
          balances.push({
            currency: curr,
            netAmount: 0,
            totalOwedToMe: 0,
            totalIOwe: 0,
          });
        }
      });

      resolve({
        balances,
        pendingCount,
        recentActivities,
      });
    }, 400);
  });
};

export const approveDebt = async (debtId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const debt = dbDebts.find((d) => d.id === debtId);
      if (debt) {
        // If it was PENDING_APPROVAL, it becomes ACTIVE
        if (debt.status === "PENDING_APPROVAL") {
          debt.status = "ACTIVE";
          debt.updatedAt = new Date().toISOString();
        } 
        // If it was SETTLED or repayment request? Settle flow below
        resolve(true);
      } else {
        resolve(false);
      }
    }, 300);
  });
};

export const rejectDebt = async (debtId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const debt = dbDebts.find((d) => d.id === debtId);
      if (debt) {
        debt.status = "REJECTED";
        debt.updatedAt = new Date().toISOString();
        resolve(true);
      } else {
        resolve(false);
      }
    }, 300);
  });
};

// Settle an active debt
export const requestSettleDebt = async (debtId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const debt = dbDebts.find((d) => d.id === debtId);
      if (debt) {
        // Requires confirmation: so it enters a pending settlement stage
        // Or for direct MVP simplicity, since payment gateway is out of scope,
        // we can mark it as SETTLED.
        debt.status = "SETTLED";
        debt.updatedAt = new Date().toISOString();
        resolve(true);
      } else {
        resolve(false);
      }
    }, 300);
  });
};

// Create a new debt record
export const createDebt = async (params: {
  debtorId: string;
  creditorId: string;
  amount: number;
  currency: string;
  description: string;
  attachmentUrl?: string;
}): Promise<Debt> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newDebt: DbDebt = {
        id: `debt-${dbDebts.length + 1}-${Date.now()}`,
        creatorId: activeUserId,
        debtorId: params.debtorId,
        creditorId: params.creditorId,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        status: "PENDING_APPROVAL", // Always starts pending approval
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachmentUrl: params.attachmentUrl,
      };

      dbDebts.push(newDebt);
      resolve(mapDbDebtToUi(newDebt, activeUserId));
    }, 400);
  });
};

// Search users by email
export const searchUserByEmail = async (email: string): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const trimmed = email.toLowerCase().trim();
      const user = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === trimmed && u.id !== activeUserId
      );
      resolve(user || null);
    }, 250);
  });
};

export const registerNewUser = (displayName: string, email: string): User => {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = MOCK_USERS.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error("User already exists");
  }
  const newUser: User = {
    id: `user-${MOCK_USERS.length + 1}-${Date.now()}`,
    email: normalizedEmail,
    displayName,
    createdAt: new Date().toISOString(),
  };
  MOCK_USERS.push(newUser);
  setActiveUser(newUser.id);
  return newUser;
};
