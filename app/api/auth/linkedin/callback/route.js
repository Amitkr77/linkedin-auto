import { NextResponse } from 'next/server';
import axios from 'axios';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const expectedState = request.cookies.get('linkedin_oauth_state')?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(new URL('/accounts?error=auth_failed', request.url));
    response.cookies.delete('linkedin_oauth_state');
    return response;
  }

  try {
    // Exchange code for access token
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

    // Fetch LinkedIn profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
      timeout: 15_000,
    });

    const profile = profileResponse.data;
    const authorUrn = `urn:li:person:${profile.sub}`;

    // Store directly in the app's Mongoose Account model — no intermediary
    await connectDB();
    await Account.findOneAndUpdate(
      { authorUrn, ownerId: session.user.id },
      {
        accessToken: access_token,
        tokenExpiresAt,
        accountType: 'person',
        displayName: profile.name || null,
        profilePictureUrl: profile.picture || null,
        email: profile.email || null,
        ownerId: session.user.id,
      },
      { upsert: true, new: true }
    );

    console.log(`[LINKEDIN] Account ${authorUrn} connected for user ${session.user.id}`);

    const response = NextResponse.redirect(new URL('/accounts?connected=true', request.url));
    response.cookies.delete('linkedin_oauth_state');
    return response;
  } catch (error) {
    console.error('LinkedIn OAuth callback failed:', error.response?.data || error.message);
    const response = NextResponse.redirect(new URL('/accounts?error=auth_failed', request.url));
    response.cookies.delete('linkedin_oauth_state');
    return response;
  }
}
