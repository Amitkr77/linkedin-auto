import { connectDB } from './db.js';
import UserActivity from './models/UserActivity.js';

function getClientIp(request) {
  const forwarded = request?.headers?.get?.('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request?.headers?.get?.('x-real-ip');
  if (real) return real.trim();
  return null;
}

function getGeoFromHeaders(request) {
  if (!request?.headers?.get) return {};
  return {
    city: request.headers.get('x-vercel-ip-city') || null,
    region: request.headers.get('x-vercel-ip-country-region') || null,
    country: request.headers.get('x-vercel-ip-country') || null,
    timezone: request.headers.get('x-vercel-ip-timezone') || null,
  };
}

async function fetchGeoFromIp(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return { city: 'Local', region: 'Local', country: 'Local', timezone: null };
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,regionName,country,timezone`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    return { city: data.city || null, region: data.regionName || null, country: data.country || null, timezone: data.timezone || null };
  } catch { return {}; }
}

/**
 * Parse user-agent string into device, browser, OS — no external deps.
 */
function parseUserAgent(ua) {
  if (!ua) return { device: null, browser: null, os: null };

  // Device
  let device = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) device = 'Tablet';
  else if (/mobile|iphone|ipod|android.*mobile|opera\s*m(ob|in)/i.test(ua)) device = 'Mobile';

  // Browser
  let browser = 'Unknown';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
  else if (/chrome\//i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox\//i.test(ua)) browser = 'Firefox';
  else if (/msie|trident/i.test(ua)) browser = 'IE';

  // OS
  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'ChromeOS';

  return { device, browser, os };
}

/**
 * Track a user action. Non-blocking — fire and forget.
 */
export async function trackActivity({ ownerId, action, request, metadata }) {
  try {
    await connectDB();
    const ip = request ? getClientIp(request) : null;
    const userAgent = request?.headers?.get?.('user-agent') || null;
    const language = request?.headers?.get?.('accept-language')?.split(',')[0]?.trim() || null;
    const referrer = request?.headers?.get?.('referer') || null;

    let geo = request ? getGeoFromHeaders(request) : {};
    if (!geo.city && ip) geo = await fetchGeoFromIp(ip);

    const { device, browser, os } = parseUserAgent(userAgent);

    await UserActivity.create({
      ownerId,
      action,
      ip,
      userAgent,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      timezone: geo.timezone,
      device,
      browser,
      os,
      language,
      referrer,
      metadata: metadata || null,
    });
  } catch (err) {
    console.warn('[ACTIVITY] Failed to track:', err.message);
  }
}
