import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  // getToken reads the NextAuth JWT cookie without importing Mongoose
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token) {
    const signIn = new URL('/sign-in', request.url);
    signIn.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/accounts/:path*', '/analytics/:path*', '/calendar/:path*', '/posts/:path*', '/schedule/:path*', '/templates/:path*'],
};
