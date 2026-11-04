import crypto from "crypto";

const SCRYPT_PREFIX = "scrypt:";
const KEY_LEN = 64;

/**
 * Hash a plaintext password using Node.js built-in scrypt with a random 16-byte salt.
 * Format: `scrypt:<hex-salt>:<hex-key>`
 * 
 * @param {string} password 
 * @returns {string} Hashed password string
 */
export function hashPassword(password) {
  if (!password || typeof password !== "string") {
    throw new TypeError("Password must be a non-empty string");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${SCRYPT_PREFIX}${salt}:${derivedKey}`;
}

/**
 * Verify an input password against a stored hash or legacy plaintext password.
 * 
 * @param {string} inputPassword - The password supplied by the user during login
 * @param {string} storedHash - The hash (or legacy plaintext) from the database
 * @returns {{ valid: boolean, needsUpgrade: boolean }}
 */
export function verifyPassword(inputPassword, storedHash) {
  if (!inputPassword || !storedHash) {
    return { valid: false, needsUpgrade: false };
  }

  // Case 1: Password is stored in scrypt hash format
  if (storedHash.startsWith(SCRYPT_PREFIX)) {
    const parts = storedHash.slice(SCRYPT_PREFIX.length).split(":");
    if (parts.length !== 2) {
      return { valid: false, needsUpgrade: false };
    }
    const [salt, expectedKeyHex] = parts;
    try {
      const actualKey = crypto.scryptSync(inputPassword, salt, KEY_LEN);
      const expectedKey = Buffer.from(expectedKeyHex, "hex");
      if (actualKey.length !== expectedKey.length) {
        return { valid: false, needsUpgrade: false };
      }
      const match = crypto.timingSafeEqual(actualKey, expectedKey);
      return { valid: match, needsUpgrade: false };
    } catch (e) {
      return { valid: false, needsUpgrade: false };
    }
  }

  // Case 2: Legacy plaintext password check
  // Uses timing-safe comparison to prevent timing side-channel leaks
  const inputBuf = Buffer.from(inputPassword, "utf8");
  const storedBuf = Buffer.from(storedHash, "utf8");

  if (inputBuf.length !== storedBuf.length) {
    return { valid: false, needsUpgrade: false };
  }

  const match = crypto.timingSafeEqual(inputBuf, storedBuf);
  return {
    valid: match,
    // If valid plaintext match, flag that this record should be upgraded to scrypt
    needsUpgrade: match
  };
}

/**
 * Remove sensitive credentials from a user / staff object before sending to client or logging.
 * 
 * @param {Object} user 
 * @returns {Object} Sanitized object
 */
export function sanitizeUser(user) {
  if (!user || typeof user !== "object") return user;
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * Sanitize an array of staff / user records.
 * 
 * @param {Array<Object>} list 
 * @returns {Array<Object>}
 */
export function sanitizeUserList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(sanitizeUser);
}
