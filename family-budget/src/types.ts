export type MoneyCategory = {
  name: string;
  actual: number;
  budget: number;
  remaining: number;
};

export type Transaction = {
  date: string;
  type: string;
  category: string;
  person: string;
  amount: number;
  method: string;
  notes: string;
  localId?: string;
  pendingSync?: boolean;
};

export type PeriodKpis = {
  actualIncome: number;
  actualExpenses: number;
  actualDebt: number;
  actualSavings: number;
  leftToSpend: number;
  budgetedIncome: number;
  budgetedExpenses: number;
  budgetedDebt: number;
  budgetedSavings: number;
  leftToBudget: number;
};

export type BudgetPeriod = {
  name: string;
  gid: string;
  startDate: string;
  endDate: string;
  kpis: PeriodKpis;
  income: MoneyCategory[];
  variable: MoneyCategory[];
  fixed: MoneyCategory[];
  savings: MoneyCategory[];
  debts: MoneyCategory[];
  transactions: Transaction[];
};

export type CreditCard = {
  name: string;
  owner: string;
  startingBalance: number;
  apr: number;
  monthlyInterest: number;
  periodBudgeted: number;
  periodPaid: number;
  totalPaid: number;
  remaining: number;
  percentPaid: number;
  status: string;
  method: string;
  limit: number;
  available: number;
  utilization: number;
};

export type CreditSummary = {
  baselineDebt: number;
  forwardPaid: number;
  remaining: number;
  payoffPercent: number;
  monthlyInterest: number;
  weightedApr: number;
  cardsPaidInFull: string;
  currentPeriodPaid: number;
  periodLabel: string;
};

export type BudgetFixture = {
  spreadsheetId: string;
  activePeriodName: string;
  periods: BudgetPeriod[];
  creditCards: {
    summary: CreditSummary;
    cards: CreditCard[];
  };
  meta: {
    people: string[];
    paymentMethods: string[];
    transactionTypes: string[];
    gids: Record<string, string>;
  };
};

export type PersonFilter = 'All' | string;

export type NewTransactionInput = {
  date: string;
  type: string;
  category: string;
  person: string;
  amount: number;
  method: string;
  notes: string;
};
