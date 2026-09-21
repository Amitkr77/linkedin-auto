import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { authDb, authMongoClient } from './authDb.js';

export const auth = betterAuth({
  appName: 'LinkedIn Automation',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(authDb, { client: authMongoClient }),
  socialProviders: {
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      scope: ['w_member_social'],
    },
  },
  trustedOrigins: [
    'http://localhost:3000',
    process.env.BETTER_AUTH_URL,
  ].filter(Boolean),
  advanced: { database: { joins: true } },
});
