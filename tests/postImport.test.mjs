import assert from 'node:assert/strict';
import test from 'node:test';
import { Readable } from 'node:stream';
import ExcelJS from 'exceljs';
import { parseUploadRows } from '../lib/postImport.js';

const headers = ['A: Post Text', 'B: Image URL (optional)', 'C: Scheduled Date', 'D: Scheduled Time', 'E: Status', 'F: Posted At', 'G: Error', 'H: Automation ID (do not edit)'];
const now = new Date('2026-09-18T00:00:00.000Z');

test('imports Pending rows using the sheet columns and chosen time zone', () => {
  const result = parseUploadRows([headers, ['A post', '', '2026-09-20', '9:30', 'Pending', '', '', '']], 'Asia/Kolkata', now);
  assert.equal(result.posts.length, 1);
  assert.equal(result.posts[0].scheduledAt.toISOString(), '2026-09-20T04:00:00.000Z');
  assert.equal(result.skipped, 0);
});

test('skips published rows and rows already linked to the sheet', () => {
  const result = parseUploadRows([headers,
    ['Old post', '', '2026-09-20', '9:30', 'Posted', '2026-09-20 09:30', '', ''],
    ['Linked post', '', '2026-09-20', '9:30', 'Pending', '', '', 'existing-id'],
    ['Already posted', '', '2026-09-20', '9:30', 'Pending', '2026-09-20 09:30', '', ''],
  ], 'Asia/Kolkata', now);
  assert.equal(result.posts.length, 0);
  assert.equal(result.skipped, 3);
});

test('rejects missing headers and past dates', () => {
  assert.throws(() => parseUploadRows([['text', 'date'], ['Hello', '2026-09-20']], 'Asia/Kolkata', now), /Required columns/);
  const result = parseUploadRows([headers, ['Old post', '', '2026-09-17', '9:30', 'Pending']], 'Asia/Kolkata', now);
  assert.equal(result.posts.length, 0);
  assert.match(result.errors[0], /future/);
});

test('CSV dates remain strings rather than shifting in the server time zone', async () => {
  const workbook = new ExcelJS.Workbook();
  const sheet = await workbook.csv.read(Readable.from([
    'Post Text,Scheduled Date,Scheduled Time,Status\nCSV post,2030-09-20,9:30,Pending\n',
  ]), { map: (value) => value });
  const matrix = [sheet.getRow(1).values.slice(1), sheet.getRow(2).values.slice(1)];
  const result = parseUploadRows(matrix, 'Asia/Kolkata', now);
  assert.equal(result.posts[0].scheduledAt.toISOString(), '2030-09-20T04:00:00.000Z');
});
