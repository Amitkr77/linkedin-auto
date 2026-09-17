import mongoose from 'mongoose';

export const ALLOWED_STATUSES = new Set(['DRAFT', 'PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED']);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif']);

export function isObjectId(value) {
  return typeof value === 'string' && mongoose.isObjectIdOrHexString(value);
}

export function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function publicError(error, fallback = 'An unexpected error occurred') {
  console.error(error);
  const { NextResponse } = await import('next/server');
  return NextResponse.json({ error: fallback }, { status: 500 });
}
