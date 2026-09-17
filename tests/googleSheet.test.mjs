import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSheetDateTime } from '../lib/sheetBridge.js';

test('converts spreadsheet time zone to an absolute publish time', () => {
  assert.equal(parseSheetDateTime('2026-09-20', '09:30', 'Asia/Kolkata').toISOString(), '2026-09-20T04:00:00.000Z');
});

test('rejects invalid date and time values', () => {
  assert.equal(parseSheetDateTime('2026-02-30', '09:30', 'Asia/Kolkata'), null);
  assert.equal(parseSheetDateTime('2026-09-20', '25:30', 'Asia/Kolkata'), null);
});

test('rejects nonexistent local time at daylight-saving transition', () => {
  assert.equal(parseSheetDateTime('2026-03-08', '02:30', 'America/New_York'), null);
});
