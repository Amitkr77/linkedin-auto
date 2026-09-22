import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { connectDB } from './db.js';
import mongoose from 'mongoose';

// Simple MongoDB session/user store using Mongoose
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
    async signIn({ user }) {
      await connectDB();
      await User.findOneAndUpdate(
        { email: user.email },
        { name: user.name, image: user.image },
        { upsert: true }
      );
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email }).lean();
        if (dbUser) token.userId = dbUser._id.toString();
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      return session;
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
});
