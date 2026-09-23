import { getSession } from './session.js';

export async function getOwnerId() {
  const session = await getSession();
  return session?.userId || null;
}

export function unauthorized() {
  return Response.json({ error: 'Authentication required' }, { status: 401 });
}
