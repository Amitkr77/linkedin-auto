import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Template from '@/lib/models/Template';
import { publicError } from '@/lib/api';

export async function GET() {
  try {
    await connectDB();
    const templates = await Template.find().sort({ usageCount: -1, updatedAt: -1 }).lean();
    return NextResponse.json(templates);
  } catch (error) {
    return publicError(error, 'Unable to load templates');
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, content, category } = body;

    if (!name || typeof name !== 'string' || name.trim().length > 100) {
      return NextResponse.json({ error: 'Name is required (max 100 chars)' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length > 3000) {
      return NextResponse.json({ error: 'Content is required (max 3000 chars)' }, { status: 400 });
    }

    await connectDB();
    const template = await Template.create({
      name: name.trim(),
      content: content.trim(),
      category: category?.trim() || 'General',
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return publicError(error, 'Unable to create template');
  }
}
