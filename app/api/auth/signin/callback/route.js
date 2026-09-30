import { NextResponse } from 'next/server';
import axios from 'axios';
import { connectDB } from '@/lib/db';
import Account from '@/lib/models/Account';
import { fetchAdminOrganizations } from '@/lib/linkedinAnalytics';
import { createSession, sessionCookieOptions } from '@/lib/session';
import { trackActivity } from '@/lib/activity';

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

    // 3. Check platform settings
    await connectDB();
    const Settings = (await import('@/lib/models/Settings')).default;
    const platformSettings = await Settings.findById('platform').lean().catch(() => null);

    // Check maintenance mode
    if (platformSettings?.maintenanceMode) {
      return redirectTo(request, '/sign-in?error=maintenance');
    }

    // Check if registration is allowed for new users
    const existingAccount = await Account.findOne({ authorUrn }).lean();
    if (!existingAccount && platformSettings?.registrationEnabled === false) {
      return redirectTo(request, '/sign-in?error=registration_closed');
    }

    // Check allowed email domains
    if (!existingAccount && platformSettings?.allowedEmailDomains) {
      const allowed = platformSettings.allowedEmailDomains.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
      if (allowed.length > 0 && profile.email) {
        const domain = profile.email.split('@')[1]?.toLowerCase();
        if (!allowed.includes(domain)) {
          return redirectTo(request, '/sign-in?error=domain_not_allowed');
        }
      }
    }

    // 3b. Store LinkedIn account
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
    trackActivity({ ownerId, action: 'login', request, metadata: {
      name: profile.name,
      email: profile.email,
      profileUrl: `https://www.linkedin.com/in/${profile.sub}`,
    } }).catch(() => {});

    // 3b. Try to fetch admin organizations (non-fatal if scopes not approved)
    try {
      const orgs = await fetchAdminOrganizations(access_token);
      for (const org of orgs) {
        await Account.findOneAndUpdate(
          { authorUrn: org.urn },
          {
            ownerId,
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
      if (orgs.length) console.log(`[AUTH] Found ${orgs.length} admin org(s)`);
    } catch (orgError) {
      console.warn('[AUTH] Could not fetch admin orgs:', orgError.message);
    }

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
