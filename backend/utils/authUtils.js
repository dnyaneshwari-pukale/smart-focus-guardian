/**
 * Authentication and Security Utilities
 * Provides secure password hashing via crypto.scrypt,
 * session token generation and verification, and input validation.
 */
const crypto = require('crypto');

const TOKEN_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'sfg_secret_session_key_2026_super_secure';

/**
 * Hashes a plaintext password using crypto.scrypt with a unique cryptographically random salt.
 * Output format: <salt_hex>:<hash_hex>
 */
function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against a stored <salt_hex>:<hash_hex> string using timing-safe comparison.
 */
function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') {
    return false;
  }
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;

  try {
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const originalBuffer = Buffer.from(originalHash, 'hex');
    if (derivedKey.length !== originalBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, originalBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Generates a signed tamper-proof authentication token.
 * Payload includes userId, email, and timestamp.
 */
function generateAuthToken(payload, expiresInMs = 7 * 24 * 60 * 60 * 1000) {
  const data = {
    ...payload,
    exp: Date.now() + expiresInMs,
    iat: Date.now()
  };
  const jsonStr = JSON.stringify(data);
  const encodedData = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(encodedData).digest('base64url');
  return `${encodedData}.${signature}`;
}

/**
 * Verifies and decodes an authentication token.
 * Returns decoded payload if valid and not expired, null otherwise.
 */
function verifyAuthToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedData, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(encodedData).digest('base64url');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Validates email format.
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateAuthToken,
  verifyAuthToken,
  isValidEmail
};
