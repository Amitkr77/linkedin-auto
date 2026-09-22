import { NextResponse } from 'next/server';
import axios from 'axios';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const expectedNonce = request.cookies.get('linkedin_oauth_nonce')?.value;

  // Parse state to get userId and nonce
  let userId, nonce;
  try {
    const parsed = JSON.parse(Buffer.from(decodeURIComponent(stateParam), 'base64url').toString());
    userId = parsed.userId;
    nonce = parsed.nonce;
  } catch {
    console.error('[LINKEDIN CALLBACK] Failed to parse state');
    return redirectError(request);
  }

  // Verify nonce matches
  if (!code || !nonce || !expectedNonce || nonce !== expectedNonce || !userId) {
    console.error('[LINKEDIN CALLBACK] State/nonce mismatch or missing code');
    return redirectError(request);
  }

  try {
    // Exchange code for access token
    console.log('[LINKEDIN CALLBACK] Exchanging code for token...');
    const tokenResponse = await axios.post(
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

    const { access_token, expires_in } = tokenResponse.data;
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);
    console.log('[LINKEDIN CALLBACK] Token obtained, fetching profile...');

    // Fetch LinkedIn profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
      timeout: 15_000,
    });

    const profile = profileResponse.data;
    const authorUrn = `urn:li:person:${profile.sub}`;
    console.log(`[LINKEDIN CALLBACK] Profile fetched: ${authorUrn} (${profile.name})`);

    // Store directly in Mongoose Account model — no intermediary, no bridge
    await connectDB();
    await Account.findOneAndUpdate(
      { authorUrn, ownerId: userId },
      {
        accessToken: access_token,
        tokenExpiresAt,
        accountType: 'person',
        displayName: profile.name || null,
        profilePictureUrl: profile.picture || null,
        email: profile.email || null,
        ownerId: userId,
      },
      { upsert: true, new: true }
    );

    console.log(`[LINKEDIN CALLBACK] Account ${authorUrn} saved for user ${userId}`);

    const response = NextResponse.redirect(new URL('/accounts?connected=true', request.url));
    response.cookies.delete('linkedin_oauth_nonce');
    return response;
  } catch (error) {
    console.error('[LINKEDIN CALLBACK] Failed:', error.response?.data || error.message);
    return redirectError(request);
  }
}

function redirectError(request) {
  const response = NextResponse.redirect(new URL('/accounts?error=auth_failed', request.url));
  response.cookies.delete('linkedin_oauth_nonce');
  return response;
}
