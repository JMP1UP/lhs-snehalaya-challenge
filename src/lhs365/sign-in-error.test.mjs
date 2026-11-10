import test from "node:test";
import assert from "node:assert/strict";
import { signInErrorMessage } from "./sign-in-error.mjs";
test("sign-in errors give actionable guidance without exposing provider details", () => {
  assert.match(signInErrorMessage({code:"auth/popup-blocked"}), /Allow pop-ups/);
  assert.match(signInErrorMessage({code:"auth/popup-closed-by-user"}), /leave it open/);
  assert.match(signInErrorMessage({code:"auth/unauthorized-domain"}), /not configured/);
  const result=signInErrorMessage({code:"auth/invalid-credential",message:"AADSTS7000222 secret expired for person@example.test token=private",customData:{email:"person@example.test"}});
  assert.match(result,/auth\/invalid-credential · AADSTS7000222/);
  assert.doesNotMatch(result,/person@|token=|private|secret expired/);
});
test("unexpected failures do not expose arbitrary error text or codes", () => {
  for (const error of [undefined, null, {code:"person@example.test",message:"private"}, {code:"toString"}]) {
    assert.match(signInErrorMessage(error),/Reference: auth\/unknown/);
    assert.doesNotMatch(signInErrorMessage(error),/person@|private|toString/);
  }
});
