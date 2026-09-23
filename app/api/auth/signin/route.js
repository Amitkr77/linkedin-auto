import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

// GET /api/auth/signin — redirects to LinkedIn OAuth
export async function GET(request) {
  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_REDIRECT_URI) {
    return NextResponse.json({ error: 'LinkedIn OAuth is not configured' }, { status: 503 });
  }

  const state = crypto.randomBytes(32).toString('base64url');
  const scope = encodeURIComponent('openid profile email w_member_social');
  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
