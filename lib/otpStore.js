/**
 * In-memory OTP store with 5-minute TTL.
 * Keys are email addresses, values are { otp, expiresAt }.
 */
const store = new Map();

const TTL = 5 * 60 * 1000; // 5 minutes

export function setOtp(email, otp) {
  store.set(email.toLowerCase(), {
    otp: String(otp),
    expiresAt: Date.now() + TTL,
  });
}

export function verifyOtp(email, otp) {
  const key = email.toLowerCase();
  const entry = store.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return false;
  }
  if (entry.otp !== String(otp)) return false;
  store.delete(key); // one-time use
  return true;
}

export function clearOtp(email) {
  store.delete(email.toLowerCase());
}
