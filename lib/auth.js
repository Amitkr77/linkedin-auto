// This file is intentionally minimal.
// Auth is handled by:
//   - lib/session.js — JWT create/verify/read
//   - app/api/auth/signin/route.js — LinkedIn OAuth initiation
//   - app/api/auth/signin/callback/route.js — LinkedIn OAuth callback + session creation
//   - middleware.js — protects pages by checking the session cookie
//   - lib/currentUser.js — getOwnerId() for API routes
