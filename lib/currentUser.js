import { auth } from './auth.js';
import { authDb } from './authDb.js';
import { connectDB } from './db.js';
import Account from './models/Account.js';

export async function getSession(request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function getOwnerId(request) {
  const session = await getSession(request);
  return session?.user?.id || null;
}

export function unauthorized() {
  return Response.json({ error: 'Authentication required' }, { status: 401 });
}

export async function syncLinkedInAccount(session) {
  if (!session?.user?.id) return null;
  const oauthAccount = await authDb.collection('account').findOne({
    userId: session.user.id,
    providerId: 'linkedin',
  });
  if (!oauthAccount?.accountId || !oauthAccount.accessToken) return null;
  await connectDB();
  const authorUrn = `urn:li:person:${oauthAccount.accountId}`;
  const existingAccount = await Account.findOne({ authorUrn }).select('+accessToken');
  let linkedInProfile = null;
  if (!existingAccount || existingAccount.accessToken !== oauthAccount.accessToken || !existingAccount.displayName) {
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${oauthAccount.accessToken}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) linkedInProfile = await response.json();
    } catch (error) {
      console.warn('Unable to refresh LinkedIn profile details:', error.message);
    }
  }
  const account = await Account.findOneAndUpdate(
    { authorUrn, $or: [{ ownerId: session.user.id }, { ownerId: null }, { ownerId: { $exists: false } }] },
    {
      $set: {
        ownerId: session.user.id,
        accessToken: oauthAccount.accessToken,
        tokenExpiresAt: oauthAccount.accessTokenExpiresAt || new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
        accountType: 'person',
        displayName: linkedInProfile?.name || existingAccount?.displayName || 'LinkedIn User',
        profilePictureUrl: linkedInProfile?.picture || existingAccount?.profilePictureUrl || null,
        email: linkedInProfile?.email || existingAccount?.email || null,
      },
    },
    { upsert: true, new: true }
  ).select('+accessToken');
  const Post = (await import('./models/Post.js')).default;
  await Post.updateMany(
    { account: account._id, $or: [{ ownerId: null }, { ownerId: { $exists: false } }] },
    { $set: { ownerId: session.user.id } }
  );
  return account;
}
