import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  sanitizeUser,
  sanitizeUserList
} from "../../lib/finance/security.js";

test("Security Engine - Hash Generation & scrypt Verification", () => {
  const password = "superSecretPassword123!";
  const hash = hashPassword(password);

  assert.ok(hash.startsWith("scrypt:"));
  assert.notEqual(hash, password);

  // Correct password verify
  const correctCheck = verifyPassword(password, hash);
  assert.equal(correctCheck.valid, true);
  assert.equal(correctCheck.needsUpgrade, false);

  // Incorrect password verify
  const wrongCheck = verifyPassword("wrongPass", hash);
  assert.equal(wrongCheck.valid, false);
});

test("Security Engine - Legacy Plaintext Verification & Auto-Upgrade Flag", () => {
  const legacyPlaintext = "manager2024";

  // Check valid plaintext
  const check = verifyPassword(legacyPlaintext, legacyPlaintext);
  assert.equal(check.valid, true);
  assert.equal(check.needsUpgrade, true); // Flag to upgrade to scrypt

  // Check wrong password
  const wrongCheck = verifyPassword("wrongPlain", legacyPlaintext);
  assert.equal(wrongCheck.valid, false);
});

test("Security Engine - Credential Sanitization (Zero Password Leaks)", () => {
  const rawStaff = {
    _id: "staff123",
    name: "John Doe",
    email: "john@hotel.com",
    role: "Cashier",
    password: "secretPassword",
    department: "Front Office"
  };

  const safe = sanitizeUser(rawStaff);
  assert.equal(safe.name, "John Doe");
  assert.equal(safe.password, undefined);
  assert.equal("password" in safe, false);

  // List sanitization
  const safeList = sanitizeUserList([rawStaff, { name: "Jane", password: "p2" }]);
  assert.equal(safeList.length, 2);
  assert.equal(safeList[0].password, undefined);
  assert.equal(safeList[1].password, undefined);
});
