import { NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function middleware(request) {
  if (!getSessionCookie(request)) {
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/accounts/:path*', '/analytics/:path*', '/calendar/:path*', '/posts/:path*', '/schedule/:path*', '/templates/:path*'],
};
