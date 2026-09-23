// Client-side fetch wrapper that redirects to /sign-in on 401
export async function fetchApi(url, options) {
  const res = await fetch(url, options);
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.replace('/sign-in');
    throw new Error('Session expired');
  }
  return res;
}
