import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');

const globalState = globalThis;
const client = globalState.betterAuthMongoClient || new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalState.betterAuthMongoClient = client;

export const authMongoClient = client;
export const authDb = client.db();
