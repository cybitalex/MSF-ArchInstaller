import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import fixture from '@/src/data/fixture.json';
import { fetchCreditCards, fetchPeriod, postTransactionToWebhook } from '@/src/lib/sheets';
import type {
  BudgetFixture,
  BudgetPeriod,
  CreditCard,
  CreditSummary,
  NewTransactionInput,
  PersonFilter,
  Transaction,
} from '@/src/types';

const LOCAL_TX_KEY = 'family-budget:local-transactions';

type BudgetContextValue = {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  source: 'live' | 'fixture';
  period: BudgetPeriod;
  periods: BudgetPeriod[];
  setActivePeriod: (name: string) => void;
  creditSummary: CreditSummary;
  cards: CreditCard[];
  people: string[];
  paymentMethods: string[];
  transactionTypes: string[];
  personFilter: PersonFilter;
  setPersonFilter: (p: PersonFilter) => void;
  transactions: Transaction[];
  refresh: () => Promise<void>;
  addTransaction: (input: NewTransactionInput) => Promise<{ message: string; synced: boolean }>;
};

const BudgetContext = createContext<BudgetContextValue | null>(null);
const seed = fixture as BudgetFixture;

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [periods, setPeriods] = useState<BudgetPeriod[]>(seed.periods);
  const [activePeriodName, setActivePeriodName] = useState(seed.activePeriodName);
  const [creditSummary, setCreditSummary] = useState(seed.creditCards.summary);
  const [cards, setCards] = useState(seed.creditCards.cards);
  const [localTxns, setLocalTxns] = useState<Transaction[]>([]);
  const [personFilter, setPersonFilter] = useState<PersonFilter>('All');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'fixture'>('fixture');

  const period = useMemo(
    () => periods.find((p) => p.name === activePeriodName) ?? periods[0],
    [periods, activePeriodName]
  );

  const loadLocal = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(LOCAL_TX_KEY);
      if (raw) setLocalTxns(JSON.parse(raw) as Transaction[]);
    } catch {
      // ignore corrupt local cache
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const gids = seed.meta.gids;
      const periodNames = seed.periods.map((p) => p.name);
      const livePeriods = await Promise.all(
        periodNames.map(async (name) => {
          const gid = gids[name];
          if (!gid) throw new Error(`Missing gid for ${name}`);
          return fetchPeriod(name, gid);
        })
      );
      const creditGid = gids['Credit Cards'];
      const credit = await fetchCreditCards(creditGid);
      setPeriods(livePeriods);
      setCreditSummary(credit.summary);
      setCards(credit.cards);
      setSource('live');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to refresh sheet';
      setError(message);
      setSource('fixture');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Show bundled sheet snapshot immediately, then refresh from Google in the background.
    loadLocal().then(() => {
      void refresh();
    });
  }, [loadLocal, refresh]);

  const transactions = useMemo(() => {
    const merged = [...localTxns, ...period.transactions];
    if (personFilter === 'All') return merged;
    return merged.filter((t) => t.person === personFilter);
  }, [localTxns, period.transactions, personFilter]);

  const addTransaction = useCallback(
    async (input: NewTransactionInput) => {
      const localId = `local-${Date.now()}`;
      const txn: Transaction = {
        ...input,
        localId,
        pendingSync: true,
      };

      const next = [txn, ...localTxns];
      setLocalTxns(next);
      await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(next));

      // Optimistically adjust visible KPIs for spend-like types
      setPeriods((prev) =>
        prev.map((p) => {
          if (p.name !== activePeriodName) return p;
          const kpis = { ...p.kpis };
          if (input.type.includes('Variable') || input.type.includes('Fixed')) {
            kpis.actualExpenses = round2(kpis.actualExpenses + input.amount);
            kpis.leftToSpend = round2(kpis.leftToSpend - input.amount);
          } else if (input.type.includes('Debts')) {
            kpis.actualDebt = round2(kpis.actualDebt + input.amount);
            kpis.leftToSpend = round2(kpis.leftToSpend - input.amount);
          } else if (input.type.includes('Savings')) {
            kpis.actualSavings = round2(kpis.actualSavings + input.amount);
            kpis.leftToSpend = round2(kpis.leftToSpend - input.amount);
          } else if (input.type.includes('Income')) {
            kpis.actualIncome = round2(kpis.actualIncome + input.amount);
            kpis.leftToSpend = round2(kpis.leftToSpend + input.amount);
            kpis.leftToBudget = round2(kpis.leftToBudget + input.amount);
          }
          return {
            ...p,
            kpis,
            transactions: [txn, ...p.transactions],
          };
        })
      );

      const sync = await postTransactionToWebhook({
        period: activePeriodName,
        ...input,
      });

      if (sync.ok) {
        const cleared = next.map((t) =>
          t.localId === localId ? { ...t, pendingSync: false } : t
        );
        setLocalTxns(cleared);
        await AsyncStorage.setItem(LOCAL_TX_KEY, JSON.stringify(cleared));
      }

      return { message: sync.message, synced: sync.ok };
    },
    [activePeriodName, localTxns]
  );

  const value: BudgetContextValue = {
    loading,
    refreshing,
    error,
    source,
    period,
    periods,
    setActivePeriod: setActivePeriodName,
    creditSummary,
    cards,
    people: seed.meta.people,
    paymentMethods: seed.meta.paymentMethods,
    transactionTypes: seed.meta.transactionTypes,
    personFilter,
    setPersonFilter,
    transactions,
    refresh,
    addTransaction,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
