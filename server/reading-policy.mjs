import { createHash } from "node:crypto";
export const CAMPAIGN = "read-for-snehalaya-2026";
export const emailKey = email => createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
export function authorisedIdentity(token, adminEmails) {
  if (!token?.uid || token.firebase?.sign_in_provider !== "microsoft.com" || token.email_verified !== true || typeof token.email !== "string" || !/^[a-z0-9._%+-]+@leicesterhigh\.co\.uk$/i.test(token.email)) {
    const error = new Error("Use a verified Leicester High Microsoft account."); error.status = 403; throw error;
  }
  const email = token.email.toLowerCase();
  return { email, key: emailKey(email), isAdmin: adminEmails.includes(email) };
}
export function requireAdmin(identity) {
  if (!identity.isAdmin) { const error = new Error("Admin access is required."); error.status = 403; throw error; }
}
export function requireMember(identity, people) {
  const person = people.find(p => p.id === identity.key && p.active !== false);
  if (!person) { const error = new Error("Your account is not on the active reading roster. Please contact an administrator."); error.status = 403; throw error; }
  return person;
}
