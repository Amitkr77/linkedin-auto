const ATTEMPT_TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS = 2;

export function sheetConfigured() {
  return Boolean(process.env.GOOGLE_APPS_SCRIPT_URL && process.env.GOOGLE_APPS_SCRIPT_SECRET);
}

async function bridgeRequest(action, data = {}) {
  if (!sheetConfigured()) throw new Error('Apps Script sheet bridge is not configured');
  const url = new URL(process.env.GOOGLE_APPS_SCRIPT_URL);
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !url.pathname.endsWith('/exec')) {
    throw new Error('GOOGLE_APPS_SCRIPT_URL must be a deployed Apps Script /exec URL');
  }
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data, secret: process.env.GOOGLE_APPS_SCRIPT_SECRET }),
        redirect: 'follow',
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
      if (!response.ok) {
        const error = new Error(`Apps Script bridge HTTP ${response.status}`);
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }
      let result;
      try {
        result = await response.json();
      } catch (error) {
        if (error.name === 'TimeoutError') throw error;
        throw new Error('Apps Script returned a non-JSON response; check web-app access and deployment version');
      }
      if (!result.ok) throw new Error(`Apps Script bridge: ${result.error || 'request failed'}`);
      return result;
    } catch (error) {
      const retryable = error.name === 'TimeoutError' || error.name === 'TypeError' || error.retryable;
      if (!retryable || attempt === MAX_ATTEMPTS) {
        if (error.name === 'TimeoutError') {
          throw new Error(`Apps Script ${action} timed out after ${MAX_ATTEMPTS} attempts of ${ATTEMPT_TIMEOUT_MS / 1000}s`);
        }
        throw error;
      }
      console.warn(`[SHEET] ${action} request failed transiently; retrying (${attempt}/${MAX_ATTEMPTS}).`);
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
}

export async function getSheet() {
  const result = await bridgeRequest('list');
  if (!Array.isArray(result.rows) || !result.spreadsheetId || !Number.isInteger(result.gid) || !result.timeZone) {
    throw new Error('Apps Script bridge returned an invalid sheet response');
  }
  return { spreadsheetId: result.spreadsheetId, title: result.title, gid: result.gid, timeZone: result.timeZone, rows: result.rows };
}

export async function getRows(sheet) {
  return sheet.rows;
}

export async function setCell(sheet, cell, value) {
  return bridgeRequest('setCell', { gid: sheet.gid, cell, value });
}

export async function setOutcome(sheet, rowNumber, status, postedAt = '', error = '') {
  return bridgeRequest('setOutcome', { gid: sheet.gid, rowNumber, status, postedAt, error });
}

export function parseSheetDateTime(dateValue, timeValue, timeZone) {
  const date = String(dateValue || '').trim();
  const time = String(timeValue || '').trim();
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time);
  if (!dateMatch || !timeMatch) return null;
  const [, year, month, day] = dateMatch.map(Number);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59 || new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) !== date) return null;
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  try {
    const offsetAt = (timestamp) => {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(timestamp);
      const zone = parts.find((part) => part.type === 'timeZoneName')?.value;
      const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(zone);
      if (zone === 'GMT') return 0;
      if (!match) throw new Error('Unsupported time zone');
      return (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] || 0)) * 60_000;
    };
    let result = wallClock - offsetAt(wallClock);
    result = wallClock - offsetAt(result);
    const formatted = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(result);
    const part = (type) => formatted.find((item) => item.type === type)?.value;
    if (`${part('year')}-${part('month')}-${part('day')}` !== date || Number(part('hour')) !== hour || Number(part('minute')) !== minute) return null;
    return new Date(result);
  } catch {
    return null;
  }
}
