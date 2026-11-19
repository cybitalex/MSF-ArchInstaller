# Family Budget (React Native / Expo)

Mobile app for the household paycheck budget Google Sheet. Phase 1 focuses on glanceable money left and fast logging.

## Screens

- **Home** — Left to spend, left to budget, period switcher, person filter
- **Categories** — Variable / fixed / savings / debts / income bars
- **Add** — Quick transaction entry (on-device always; sheet sync via webhook)
- **Activity** — Recent transactions
- **Debt** — Credit card payoff dashboard

## Run

```bash
cd family-budget
npm install
npm run web      # or: npm run ios / npm run android
```

Requires the Google Sheet shared as **Anyone with the link → Viewer** for live CSV sync. A fixture snapshot is bundled so the UI works offline.

## Sheet write-back (optional)

1. Open the spreadsheet → Extensions → Apps Script
2. Paste `scripts/SheetsWrite.gs` and deploy as a Web App
3. Set `EXPO_PUBLIC_SHEETS_WEBHOOK_URL` to that URL (e.g. in `.env`)

Without the webhook, adds still appear locally and adjust Home KPIs.

## Config

Spreadsheet ID and period GIDs live in `src/data/fixture.json` and `src/lib/sheets.ts`.
