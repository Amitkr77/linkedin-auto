import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    await mongoose.connection.db.admin().ping();
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }
}
