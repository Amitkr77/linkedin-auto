import { connectDB } from './db.js';
import UserActivity from './models/UserActivity.js';

/**
 * Extract client IP from request headers (works on Vercel and local).
 */
function getClientIp(request) {
  // Vercel/Cloudflare headers
  const forwarded = request?.headers?.get?.('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = request?.headers?.get?.('x-real-ip');
  if (real) return real.trim();
  return null;
}

/**
 * Extract geo info from Vercel's headers (free on Vercel, null locally).
 */
function getGeoFromHeaders(request) {
  if (!request?.headers?.get) return {};
  return {
    city: request.headers.get('x-vercel-ip-city') || null,
    region: request.headers.get('x-vercel-ip-country-region') || null,
    country: request.headers.get('x-vercel-ip-country') || null,
    timezone: request.headers.get('x-vercel-ip-timezone') || null,
  };
}

/**
 * Fallback: fetch geo from free IP API (ip-api.com).
 * Only called if Vercel headers are absent.
 */
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
    return {
      city: data.city || null,
      region: data.regionName || null,
      country: data.country || null,
      timezone: data.timezone || null,
    };
  } catch {
    return {};
  }
}

/**
 * Track a user action. Non-blocking — fire and forget.
 * @param {Object} params
 * @param {string} params.ownerId - user ID
 * @param {string} params.action - action type
 * @param {Request} [params.request] - Next.js request for IP/geo extraction
 * @param {Object} [params.metadata] - extra data (postId, etc.)
 */
export async function trackActivity({ ownerId, action, request, metadata }) {
  try {
    await connectDB();
    const ip = request ? getClientIp(request) : null;
    const userAgent = request?.headers?.get?.('user-agent') || null;

    // Try Vercel geo headers first, fallback to IP API
    let geo = request ? getGeoFromHeaders(request) : {};
    if (!geo.city && ip) {
      geo = await fetchGeoFromIp(ip);
    }

    await UserActivity.create({
      ownerId,
      action,
      ip,
      userAgent,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      timezone: geo.timezone,
      metadata: metadata || null,
    });
  } catch (err) {
    console.warn('[ACTIVITY] Failed to track:', err.message);
  }
}
