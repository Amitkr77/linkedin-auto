import { connectDB } from './db.js';

let _cache = null;
let _cacheTime = 0;
const TTL = 30_000; // 30 seconds

/**
 * Get platform settings (cached for 30s).
 */
export async function getPlatformSettings() {
  const now = Date.now();
  if (_cache && now - _cacheTime < TTL) return _cache;
  try {
    await connectDB();
    const Settings = (await import('./models/Settings.js')).default;
    _cache = await Settings.findById('platform').lean();
    _cacheTime = now;
    return _cache;
  } catch {
    return _cache;
  }
}

/**
 * Check if platform is in maintenance mode.
 * Returns a Response if blocked, or null if allowed.
 */
export async function checkMaintenance() {
  const settings = await getPlatformSettings();
  if (settings?.maintenanceMode) {
    return Response.json(
      { error: settings.maintenanceMessage || 'Platform is under maintenance.' },
      { status: 503 }
    );
  }
  return null;
}

/**
 * Check if an IP is blacklisted.
 */
export async function checkIpBlacklist(request) {
  const settings = await getPlatformSettings();
  if (!settings?.ipBlacklist) return null;
  const blockedIps = settings.ipBlacklist.split(',').map(ip => ip.trim()).filter(Boolean);
  if (blockedIps.length === 0) return null;
  const forwarded = request?.headers?.get?.('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : request?.headers?.get?.('x-real-ip');
  if (clientIp && blockedIps.includes(clientIp)) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }
  return null;
}

export function clearPlatformCache() {
  _cache = null;
  _cacheTime = 0;
}
