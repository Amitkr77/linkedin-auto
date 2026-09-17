// Sheet bridge for the LinkedIn Automation application.
// This script NEVER publishes to LinkedIn. The application owns scheduling
// and publishing; the sheet is only an input/status interface.

const SHEET_ID = '1Z4cw6wFGpX9mRnA8I3aS-bSD5rxPqR4TENdPSWHUxqE';
const TAB_GID = 0;

function doPost(event) {
  try {
    const request = JSON.parse(event && event.postData && event.postData.contents || '{}');
    const expected = PropertiesService.getScriptProperties().getProperty('SHEET_BRIDGE_SECRET');
    if (!expected || expected.length < 32 || request.secret !== expected) {
      throw new Error('Unauthorized');
    }
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheets().find(tab => tab.getSheetId() === TAB_GID);
    if (!sheet) throw new Error('Configured sheet tab was not found');

    if (request.action === 'list') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 5000) throw new Error('Sheet exceeds the 5000-row bridge limit');
      const rows = lastRow ? sheet.getRange(1, 1, lastRow, 8).getDisplayValues() : [];
      return json_({ ok: true, spreadsheetId: SHEET_ID, title: sheet.getName(), gid: TAB_GID,
        timeZone: spreadsheet.getSpreadsheetTimeZone(), rows });
    }

    if (request.gid !== TAB_GID) throw new Error('Wrong sheet tab');
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) throw new Error('Sheet is busy; retry later');
    try {
      if (request.action === 'setCell') {
        const cell = String(request.cell || '');
        if (!/^H(?:[1-9]\d*)$/.test(cell) || String(request.value || '').length > 120) {
          throw new Error('Invalid automation ID cell');
        }
        sheet.getRange(cell).setValue(String(request.value || ''));
      } else if (request.action === 'setOutcome') {
        const rowNumber = Number(request.rowNumber);
        const allowed = ['Scheduled', 'Posting', 'Posted', 'Error'];
        if (!Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > sheet.getLastRow() ||
            !allowed.includes(request.status)) throw new Error('Invalid outcome update');
        sheet.getRange(rowNumber, 5, 1, 3).setValues([[
          request.status,
          String(request.postedAt || '').slice(0, 40),
          String(request.error || '').slice(0, 250)
        ]]);
      } else {
        throw new Error('Unknown action');
      }
      SpreadsheetApp.flush();
      return json_({ ok: true });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error('Sheet bridge request failed:', error.message);
    return json_({ ok: false, error: error.message === 'Unauthorized' ? 'Unauthorized' : error.message });
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

// A previously installed direct-publishing trigger is harmless after this
// replacement, but remove it to avoid unnecessary executions.
function checkDuePosts() {
  console.log('Direct sheet publishing is disabled. The application now owns scheduling.');
}

function removeMinuteTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => ['checkDuePosts', 'checkAndPostScheduled'].includes(trigger.getHandlerFunction()))
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  console.log('Old direct-publishing trigger removed.');
}

// Wakes the deployed application; only the application reads the sheet and
// publishes to LinkedIn. This works even when the application runs on Vercel.
function wakeApplication() {
  const properties = PropertiesService.getScriptProperties();
  const url = properties.getProperty('APP_CRON_URL');
  const secret = properties.getProperty('APP_CRON_SECRET');
  if (!url || !/^https:\/\/[^/?#]+\/api\/cron$/.test(url) || !secret || secret.length < 16) {
    throw new Error('Set APP_CRON_URL and a 16+ character APP_CRON_SECRET in Script Properties');
  }
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { Authorization: `Bearer ${secret}` },
    muteHttpExceptions: true,
    followRedirects: false,
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error(`Application scheduler returned HTTP ${status}`);
  }
  console.log('Application scheduler tick completed.');
}

function installAppWakeupTrigger() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty('APP_CRON_URL') || !properties.getProperty('APP_CRON_SECRET')) {
    throw new Error('Set APP_CRON_URL and APP_CRON_SECRET before installing the trigger');
  }
  const existing = ScriptApp.getProjectTriggers()
    .some(trigger => trigger.getHandlerFunction() === 'wakeApplication');
  if (existing) {
    console.log('Application wake-up trigger already exists.');
    return;
  }
  ScriptApp.newTrigger('wakeApplication').timeBased().everyMinutes(1).create();
  console.log('One-minute application wake-up trigger installed.');
}

function removeAppWakeupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'wakeApplication')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  console.log('Application wake-up trigger removed.');
}
