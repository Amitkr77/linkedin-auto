import assert from 'node:assert/strict';
import test from 'node:test';
import { getRows, getSheet, setOutcome } from '../lib/sheetBridge.js';

test('the application reads and updates the Apps Script bridge with a shared secret', async () => {
  const previousUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const previousSecret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  const previousFetch = globalThis.fetch;
  const requests = [];
  process.env.GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/test/exec';
  process.env.GOOGLE_APPS_SCRIPT_SECRET = 'a'.repeat(64);
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    return new Response(JSON.stringify(body.action === 'list'
      ? { ok: true, spreadsheetId: 'sheet-id', gid: 0, title: 'Posts', timeZone: 'Asia/Kolkata', rows: [['Post Text'], ['Hello']] }
      : { ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const sheet = await getSheet();
    assert.equal(sheet.spreadsheetId, 'sheet-id');
    assert.equal((await getRows(sheet))[1][0], 'Hello');
    await setOutcome(sheet, 2, 'Scheduled');
    assert.deepEqual(requests.map((request) => request.action), ['list', 'setOutcome']);
    assert.ok(requests.every((request) => request.secret === 'a'.repeat(64)));
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
    else process.env.GOOGLE_APPS_SCRIPT_URL = previousUrl;
    if (previousSecret === undefined) delete process.env.GOOGLE_APPS_SCRIPT_SECRET;
    else process.env.GOOGLE_APPS_SCRIPT_SECRET = previousSecret;
  }
});
