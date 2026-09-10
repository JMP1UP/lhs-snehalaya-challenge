export const liveReading = import.meta.env.VITE_READING_LIVE === "true";
let instance;
export async function schoolClient() {
  if (!liveReading) throw new Error("School reading is not enabled yet.");
  if (!instance) instance = initialise().catch(error => { instance = undefined; throw error; });
  return instance;
}
async function initialise() {
  const config = JSON.parse(import.meta.env.VITE_READING_FIREBASE_CONFIG || "{}");
  const tenant = import.meta.env.VITE_READING_MICROSOFT_TENANT;
  if (!config.projectId || !config.apiKey || !config.authDomain || !tenant) throw new Error("School sign-in setup is incomplete.");
  const [{ initializeApp, getApps }, sdk] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const app = getApps().find(app => app.name === "reading-identity") || initializeApp(config,"reading-identity");
  const auth = sdk.getAuth(app);
  await sdk.setPersistence(auth,sdk.browserSessionPersistence);
  const provider = new sdk.OAuthProvider("microsoft.com");
  provider.setCustomParameters({tenant, prompt:"select_account"});
  return {
    watch: callback => sdk.onAuthStateChanged(auth,callback),
    signIn: () => sdk.signInWithPopup(auth,provider),
    signOut: () => sdk.signOut(auth),
    async request(user,resource="me",body) {
      if (auth.currentUser?.uid !== user.uid) throw new Error("Your account changed. Sign in again.");
      const token = await user.getIdToken();
      const response = await fetch(`/api/reading?resource=${encodeURIComponent(resource)}`, {
        method:body ? "POST" : "GET", cache:"no-store", signal:AbortSignal.timeout(20000),
        headers:{Authorization:`Bearer ${token}`, ...(body ? {"Content-Type":"application/json"} : {})},
        ...(body ? {body:JSON.stringify(body)} : {}),
      });
      const result = await response.json();
      if (auth.currentUser?.uid !== user.uid) throw new Error("Your account changed. Sign in again.");
      if (!response.ok) { const error = new Error(result.error || "Reading could not be loaded or saved."); error.status=response.status; throw error; }
      return result;
    },
  };
}
