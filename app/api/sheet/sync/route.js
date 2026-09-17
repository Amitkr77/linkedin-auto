import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { sheetConfigured } from '@/lib/sheetBridge';
import { syncSheet } from '@/workers/sheetSync';

export const runtime = 'nodejs';

export async function POST(request) {
  const configuredKey = process.env.SHEET_SYNC_ADMIN_KEY;
  if (!configuredKey || configuredKey.length < 32) {
    return NextResponse.json({ error: 'Set SHEET_SYNC_ADMIN_KEY (at least 32 characters) on the server to enable manual sheet sync.' }, { status: 503 });
  }

  const suppliedKey = request.headers.get('x-sheet-sync-admin-key') || '';
  const expected = crypto.createHash('sha256').update(configuredKey).digest();
  const supplied = crypto.createHash('sha256').update(suppliedKey).digest();
  if (!crypto.timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ error: 'Invalid sheet sync admin key.' }, { status: 401 });
  }
  if (!sheetConfigured()) {
    return NextResponse.json({ error: 'Google Sheet bridge is not configured on the server.' }, { status: 503 });
  }

  try {
    await syncSheet();
    return NextResponse.json({ message: 'Sheet sync finished. Check the post list and sheet status for any row errors.' });
  } catch (error) {
    console.error('[MANUAL SHEET SYNC ERROR]', error);
    return NextResponse.json({ error: 'Sheet sync failed. Check the server logs and try again.' }, { status: 502 });
  }
}
