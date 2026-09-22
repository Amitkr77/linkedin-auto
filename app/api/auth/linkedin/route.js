import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// GET /api/auth/linkedin — initiates LinkedIn OAuth to connect a LinkedIn account
export async function GET(request) {
  // Use getToken (works in any context) instead of auth()
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token?.userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_REDIRECT_URI) {
    return NextResponse.json({ error: 'LinkedIn OAuth is not configured' }, { status: 503 });
  }

  // Encode the userId into the state so the callback can read it without needing auth()
  const nonce = crypto.randomBytes(16).toString('base64url');
  const state = Buffer.from(JSON.stringify({ nonce, userId: token.userId })).toString('base64url');
  const scope = encodeURIComponent('openid profile email w_member_social');
  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${process.env.LINKEDIN_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}`;

  const response = NextResponse.redirect(authUrl);
  // Store nonce in cookie so callback can verify the state wasn't tampered with
  response.cookies.set('linkedin_oauth_nonce', nonce, {
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
