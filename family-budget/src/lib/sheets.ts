import { parseCsv, cell } from '@/src/lib/csv';
import { parseMoney } from '@/src/lib/money';
import type {
  BudgetPeriod,
  CreditCard,
  CreditSummary,
  MoneyCategory,
  Transaction,
} from '@/src/types';

export const SPREADSHEET_ID = '1FJrqFPvOHbdws4Zv-Q7CaVpNMhj_Fbhg';

export function csvExportUrl(gid: string, spreadsheetId = SPREADSHEET_ID): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
}

async function fetchCsv(gid: string): Promise<string[][]> {
  const res = await fetch(csvExportUrl(gid), {
    headers: { Accept: 'text/csv' },
  });
  if (!res.ok) {
    throw new Error(`Sheet fetch failed (${res.status}) for gid ${gid}`);
  }
  const text = await res.text();
  if (text.trim().startsWith('<!DOCTYPE') || text.includes('accounts.google.com')) {
    throw new Error('Sheet is not publicly readable. Share it as Anyone with the link → Viewer.');
  }
  return parseCsv(text);
}

function collectBlock(
  rows: string[][],
  start: number,
  end: number,
  catCols: number[],
  actCol: number,
  budCol: number
): MoneyCategory[] {
  const out: MoneyCategory[] = [];
  for (let r = start; r < end; r++) {
    let cat = '';
    for (const cc of catCols) {
      const v = cell(rows, r, cc);
      if (v && !['Category', 'Total', '☑️', 'FALSE', 'TRUE'].includes(v) && !v.startsWith('$')) {
        cat = v;
        break;
      }
    }
    if (!cat || cat.toLowerCase() === 'total') continue;
    const actual = parseMoney(cell(rows, r, actCol));
    const budget = parseMoney(cell(rows, r, budCol));
    out.push({
      name: cat,
      actual: round2(actual),
      budget: round2(budget),
      remaining: round2(budget - actual),
    });
  }
  return out;
}

function collectVariable(rows: string[][]): MoneyCategory[] {
  const out: MoneyCategory[] = [];
  for (let r = 28; r < 43; r++) {
    let cat = cell(rows, r, 24) || cell(rows, r, 23);
    if (!cat || ['Category', '☑️', 'Total', 'FALSE', 'TRUE'].includes(cat) || cat.startsWith('$')) {
      continue;
    }
    const actual = parseMoney(cell(rows, r, 30));
    const budget = parseMoney(cell(rows, r, 40));
    out.push({
      name: cat,
      actual: round2(actual),
      budget: round2(budget),
      remaining: round2(budget - actual),
    });
  }
  return out;
}

function collectTransactions(rows: string[][]): Transaction[] {
  const txns: Transaction[] = [];
  for (let r = 68; r < Math.min(900, rows.length); r++) {
    const date = cell(rows, r, 2);
    const type = cell(rows, r, 6);
    const category = cell(rows, r, 12);
    const person = cell(rows, r, 18);
    const amountRaw = cell(rows, r, 22);
    const method = cell(rows, r, 26);
    const notes = cell(rows, r, 32);
    if (!amountRaw.startsWith('$')) continue;
    if (!date && !category) continue;
    txns.push({
      date,
      type,
      category,
      person,
      amount: round2(parseMoney(amountRaw)),
      method,
      notes,
    });
  }
  return txns;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function parsePeriodCsv(rows: string[][], name: string, gid: string): BudgetPeriod {
  const income = collectBlock(rows, 28, 43, [1], 8, 18).filter(
    (x) =>
      x.actual ||
      x.budget ||
      ['ABADIQ', 'ARMY', 'Random money', 'Leftover 💸', 'Leftover'].includes(x.name)
  );

  return {
    name,
    gid,
    startDate: cell(rows, 6, 4),
    endDate: cell(rows, 6, 12),
    kpis: {
      actualIncome: round2(parseMoney(cell(rows, 3, 25))),
      actualExpenses: round2(parseMoney(cell(rows, 3, 33))),
      actualDebt: round2(parseMoney(cell(rows, 3, 41))),
      actualSavings: round2(parseMoney(cell(rows, 3, 49))),
      leftToSpend: round2(parseMoney(cell(rows, 3, 57))),
      budgetedIncome: round2(parseMoney(cell(rows, 6, 25))),
      budgetedExpenses: round2(parseMoney(cell(rows, 6, 33))),
      budgetedDebt: round2(parseMoney(cell(rows, 6, 41))),
      budgetedSavings: round2(parseMoney(cell(rows, 6, 49))),
      leftToBudget: round2(parseMoney(cell(rows, 6, 57))),
    },
    income,
    variable: collectVariable(rows),
    fixed: collectBlock(rows, 28, 44, [46], 52, 62),
    savings: collectBlock(rows, 48, 63, [1], 8, 18),
    debts: collectBlock(rows, 48, 64, [46], 52, 62),
    transactions: collectTransactions(rows),
  };
}

export function parseCreditCsv(rows: string[][]): {
  summary: CreditSummary;
  cards: CreditCard[];
} {
  const cards: CreditCard[] = [];
  for (let r = 9; r < 21; r++) {
    const name = cell(rows, r, 1);
    if (!name || name.startsWith('Total')) continue;
    cards.push({
      name,
      owner: cell(rows, r, 2),
      startingBalance: round2(parseMoney(cell(rows, r, 3))),
      apr: round2(parseMoney(cell(rows, r, 4))),
      monthlyInterest: round2(parseMoney(cell(rows, r, 5))),
      periodBudgeted: round2(parseMoney(cell(rows, r, 6))),
      periodPaid: round2(parseMoney(cell(rows, r, 7))),
      totalPaid: round2(parseMoney(cell(rows, r, 8))),
      remaining: round2(parseMoney(cell(rows, r, 9))),
      percentPaid: round2(parseMoney(cell(rows, r, 10))),
      status: cell(rows, r, 12),
      method: cell(rows, r, 13),
      limit: round2(parseMoney(cell(rows, r, 14))),
      available: round2(parseMoney(cell(rows, r, 15))),
      utilization: round2(parseMoney(cell(rows, r, 16))),
    });
  }

  return {
    summary: {
      baselineDebt: round2(parseMoney(cell(rows, 2, 5))),
      forwardPaid: round2(parseMoney(cell(rows, 2, 7))),
      remaining: round2(parseMoney(cell(rows, 2, 9))),
      payoffPercent: round2(parseMoney(cell(rows, 2, 11))),
      monthlyInterest: round2(parseMoney(cell(rows, 5, 5))),
      weightedApr: round2(parseMoney(cell(rows, 5, 7))),
      cardsPaidInFull: cell(rows, 5, 9),
      currentPeriodPaid: round2(parseMoney(cell(rows, 5, 11))),
      periodLabel: cell(rows, 2, 1),
    },
    cards,
  };
}

export async function fetchPeriod(name: string, gid: string): Promise<BudgetPeriod> {
  const rows = await fetchCsv(gid);
  return parsePeriodCsv(rows, name, gid);
}

export async function fetchCreditCards(gid: string) {
  const rows = await fetchCsv(gid);
  return parseCreditCsv(rows);
}

/**
 * Optional write path: deploy the Apps Script in `/scripts/SheetsWrite.gs`
 * and set EXPO_PUBLIC_SHEETS_WEBHOOK_URL to the web app URL.
 */
export async function postTransactionToWebhook(
  payload: Record<string, unknown>
): Promise<{ ok: boolean; message: string }> {
  const url = process.env.EXPO_PUBLIC_SHEETS_WEBHOOK_URL;
  if (!url) {
    return {
      ok: false,
      message: 'No webhook configured. Saved on-device only.',
    };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { ok: false, message: `Webhook failed (${res.status})` };
  }
  return { ok: true, message: 'Synced to Google Sheet' };
}
