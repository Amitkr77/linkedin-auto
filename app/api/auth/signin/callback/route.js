import { NextResponse } from 'next/server';
import axios from 'axios';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import { createSession, sessionCookieOptions } from '@/lib/session';

// GET /api/auth/signin/callback — LinkedIn OAuth callback
// This single route does everything: authenticate the user AND store their LinkedIn token.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const expectedState = request.cookies.get('oauth_state')?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    console.error('[AUTH] State mismatch or missing code');
    return redirectTo(request, '/sign-in?error=auth_failed');
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15_000 }
    );
    const { access_token, expires_in } = tokenRes.data;
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // 2. Fetch LinkedIn profile (identity)
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
      timeout: 15_000,
    });
    const profile = profileRes.data;
    const authorUrn = `urn:li:person:${profile.sub}`;

    // The ownerId is the LinkedIn person ID — unique per user
    const ownerId = profile.sub;

    // 3. Store LinkedIn account (token + profile) in one step
    await connectDB();
    await Account.findOneAndUpdate(
      { authorUrn },
      {
        ownerId,
        accessToken: access_token,
        tokenExpiresAt,
        accountType: 'person',
        displayName: profile.name || null,
        profilePictureUrl: profile.picture || null,
        email: profile.email || null,
      },
      { upsert: true, new: true }
    );

    console.log(`[AUTH] Signed in: ${profile.name} (${authorUrn})`);

    // 4. Create session JWT and set it as a cookie
    const jwt = await createSession({
      userId: ownerId,
      authorUrn,
      name: profile.name || 'LinkedIn User',
      email: profile.email || null,
      picture: profile.picture || null,
    });

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set(sessionCookieOptions(jwt));
    response.cookies.delete('oauth_state');
    return response;
  } catch (error) {
    console.error('[AUTH] LinkedIn callback failed:', error.response?.data || error.message);
    return redirectTo(request, '/sign-in?error=auth_failed');
  }
}

function redirectTo(request, path) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.delete('oauth_state');
  return response;
}
