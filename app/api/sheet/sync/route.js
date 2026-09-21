export async function POST() {
  return Response.json({ error: 'Shared Google Sheet sync is disabled for multi-user safety. Use CSV / Excel import.' }, { status: 410 });
}
