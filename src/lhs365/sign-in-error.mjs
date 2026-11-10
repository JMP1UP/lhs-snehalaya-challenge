const messages = {
  "auth/popup-blocked": "Your browser blocked the Microsoft sign-in window. Allow pop-ups for this site, then try again.",
  "auth/popup-closed-by-user": "The Microsoft window closed before sign-in completed. Try again and leave it open until you return here.",
  "auth/cancelled-popup-request": "Another sign-in was started. Close the extra Microsoft window and try again.",
  "auth/network-request-failed": "The connection to Microsoft sign-in was interrupted. Check your connection and try again.",
  "auth/unauthorized-domain": "School sign-in is not configured for this web address. Please share the reference below with school IT.",
  "auth/operation-not-allowed": "Microsoft sign-in needs attention in the school configuration. Please share the reference below with school IT.",
  "auth/invalid-oauth-response": "Microsoft returned an unsuccessful sign-in response. Please share the reference below with school IT.",
  "auth/invalid-oauth-client-id": "The Microsoft app configuration needs attention. Please share the reference below with school IT.",
  "auth/invalid-credential": "Microsoft could not complete the sign-in connection. Please share the reference below with school IT.",
  "auth/account-exists-with-different-credential": "This account already uses a different sign-in method. Please contact school IT before trying another account.",
  "auth/user-disabled": "Sign-in is disabled for this account. Please contact school IT.",
  "auth/web-storage-unsupported": "Your browser cannot save this sign-in session. Allow site storage or try a normal browser window.",
  "auth/too-many-requests": "Sign-in has been temporarily limited. Wait a few minutes before trying again.",
  "auth/internal-error": "The school sign-in connection could not be completed. Please share the reference below with school IT.",
};
export function signInErrorMessage(error) {
  const code = Object.hasOwn(messages, error?.code) ? error.code : "auth/unknown";
  // Only expose standard error identifiers, never provider messages, tokens or account details.
  const providerCode = typeof error?.message === "string" ? error.message.match(/\bAADSTS\d{5,9}\b/)?.[0] : undefined;
  const message = messages[code] || "Sign-in did not finish. Try again, or share the reference below with school IT.";
  return `${message} Reference: ${code}${providerCode ? ` · ${providerCode}` : ""}.`;
}
