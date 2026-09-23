import { NextResponse } from 'next/server';

// POST /api/auth/signout — clears session cookie
export async function POST(request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('session', '', { path: '/', maxAge: 0 });
  return response;
}
