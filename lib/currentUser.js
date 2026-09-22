import { auth } from './auth.js';

export async function getSession(request) {
  // NextAuth v5: auth() reads the session from the JWT cookie
  const session = await auth();
  return session;
}

export async function getOwnerId(request) {
  const session = await getSession(request);
  return session?.user?.id || null;
}

export function unauthorized() {
  return Response.json({ error: 'Authentication required' }, { status: 401 });
}
