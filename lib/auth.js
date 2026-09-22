import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { connectDB } from './db.js';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  image: { type: String },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only upsert on actual sign-in, not on every request
      if (account?.provider === 'google') {
        try {
          await connectDB();
          await User.findOneAndUpdate(
            { email: user.email },
            { name: user.name, image: user.image },
            { upsert: true }
          );
        } catch (err) {
          console.error('[AUTH] Failed to upsert user:', err.message);
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Only fetch userId on initial sign-in, not on every JWT refresh
      if (trigger === 'signIn' && user?.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email }).lean();
          if (dbUser) token.userId = dbUser._id.toString();
        } catch (err) {
          console.error('[AUTH] Failed to fetch userId:', err.message);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) session.user.id = token.userId;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs and same-origin redirects
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
});
