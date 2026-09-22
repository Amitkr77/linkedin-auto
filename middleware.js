import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request) {
  const session = await auth();
  if (!session?.user) {
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/accounts/:path*', '/analytics/:path*', '/calendar/:path*', '/posts/:path*', '/schedule/:path*', '/templates/:path*'],
};
