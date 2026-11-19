/**
 * Deploy as a Google Apps Script Web App (Execute as: Me, Who has access: Anyone).
 * Bind the script to the family budget spreadsheet, then set the web app URL as
 * EXPO_PUBLIC_SHEETS_WEBHOOK_URL in the Expo app.
 *
 * Expected JSON body:
 * {
 *   "period": "1111-1127",
 *   "date": "11/18/2026",
 *   "type": "✨ Variable Expenses",
 *   "category": "Groceries 🛒",
 *   "person": "Alex 🖥️",
 *   "amount": 12.34,
 *   "method": "Chase CC",
 *   "notes": "optional"
 * }
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(body.period);
    if (!sheet) {
      return json_({ ok: false, error: 'Period tab not found: ' + body.period });
    }

    // Transactions Tracker starts around row 69 (1-indexed), columns:
    // B checkbox, C date, G type, M category, S person, W amount, AA method, AG notes
    const startRow = 69;
    const last = Math.max(sheet.getLastRow(), startRow);
    let target = startRow;
    for (var r = startRow; r <= last + 50; r++) {
      var amountCell = sheet.getRange(r, 23).getValue(); // col W
      if (amountCell === '' || amountCell === null) {
        target = r;
        break;
      }
      target = r + 1;
    }

    sheet.getRange(target, 2).setValue(false); // checkbox
    sheet.getRange(target, 3).setValue(body.date || '');
    sheet.getRange(target, 7).setValue(body.type || '');
    sheet.getRange(target, 13).setValue(body.category || '');
    sheet.getRange(target, 19).setValue(body.person || '');
    sheet.getRange(target, 23).setValue(Number(body.amount) || 0);
    sheet.getRange(target, 27).setValue(body.method || '');
    sheet.getRange(target, 33).setValue(body.notes || '');

    return json_({ ok: true, row: target });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
