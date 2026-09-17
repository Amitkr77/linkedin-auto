import { NextResponse } from 'next/server';
import axios from 'axios';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import { fetchAdminOrganizations } from '@/lib/linkedinAnalytics';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const expectedState = request.cookies.get('linkedin_oauth_state')?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    const response = NextResponse.redirect(new URL('/?error=auth_failed', request.url));
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

    // Get LinkedIn profile to derive the person URN
    const profileResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
      timeout: 15_000,
    });

    const profile = profileResponse.data;
    const authorUrn = `urn:li:person:${profile.sub}`;

    await connectDB();
    await Account.findOneAndUpdate(
      { authorUrn },
      {
        accessToken: access_token,
        tokenExpiresAt,
        accountType: 'person',
        displayName: profile.name || null,
        profilePictureUrl: profile.picture || null,
        email: profile.email || null,
      },
      { upsert: true, new: true }
    );

    // Fetch admin organizations and store as separate accounts
    try {
      const orgs = await fetchAdminOrganizations(access_token);
      for (const org of orgs) {
        await Account.findOneAndUpdate(
          { authorUrn: org.urn },
          {
            accessToken: access_token,
            tokenExpiresAt,
            accountType: 'organization',
            displayName: org.name,
            profilePictureUrl: org.logoUrl || null,
            linkedPersonUrn: authorUrn,
          },
          { upsert: true, new: true }
        );
      }
    } catch (orgError) {
      // Non-fatal: org scopes may not be approved yet
      console.warn('Could not fetch admin orgs:', orgError.message);
    }

    // Redirect to dashboard after successful auth
    const response = NextResponse.redirect(new URL('/?connected=true', request.url));
    response.cookies.delete('linkedin_oauth_state');
    return response;
  } catch (error) {
    console.error('OAuth callback failed:', error.response?.status || error.message);
    const response = NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    response.cookies.delete('linkedin_oauth_state');
    return response;
  }
}
