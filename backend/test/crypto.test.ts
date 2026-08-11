import { test } from "node:test";
import assert from "node:assert/strict";
import { encrypt, decrypt } from "../src/lib/crypto.js";

test("encrypt → decrypt round-trip", () => {
  const plain = "Maya prefers a quiet corner and short written steps.";
  const ciphertext = encrypt(plain);
  assert.notEqual(ciphertext, plain);
  assert.equal(decrypt(ciphertext), plain);
});

test("every encryption uses a fresh IV", () => {
  const a = encrypt("same plaintext");
  const b = encrypt("same plaintext");
  assert.notEqual(a, b);
});

test("tampered ciphertext fails to decrypt", () => {
  const ciphertext = Buffer.from(encrypt("hello world"), "base64");
  ciphertext[28] = (ciphertext[28] ?? 0) ^ 0xff;
  assert.throws(() => decrypt(ciphertext.toString("base64")));
});
