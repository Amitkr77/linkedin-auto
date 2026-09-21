import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Template from '@/lib/models/Template';
import { isObjectId, publicError } from '@/lib/api';
import { getOwnerId, unauthorized } from '@/lib/currentUser';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const ownerId = await getOwnerId(request);
    if (!ownerId) return unauthorized();
    if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid template id' }, { status: 400 });
    await connectDB();
    const template = await Template.findOne({ _id: id, ownerId }).lean();
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json(template);
  } catch (error) {
    return publicError(error, 'Unable to load template');
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const ownerId = await getOwnerId(request);
    if (!ownerId) return unauthorized();
    if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid template id' }, { status: 400 });
    const body = await request.json();

    await connectDB();
    const template = await Template.findOne({ _id: id, ownerId });
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    if (body.name !== undefined) template.name = body.name.trim();
    if (body.content !== undefined) template.content = body.content.trim();
    if (body.category !== undefined) template.category = body.category.trim();
    await template.save();

    return NextResponse.json(template);
  } catch (error) {
    return publicError(error, 'Unable to update template');
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const ownerId = await getOwnerId(request);
    if (!ownerId) return unauthorized();
    if (!isObjectId(id)) return NextResponse.json({ error: 'Invalid template id' }, { status: 400 });
    await connectDB();
    const template = await Template.findOneAndDelete({ _id: id, ownerId });
    if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    return NextResponse.json({ message: 'Template deleted' });
  } catch (error) {
    return publicError(error, 'Unable to delete template');
  }
}
