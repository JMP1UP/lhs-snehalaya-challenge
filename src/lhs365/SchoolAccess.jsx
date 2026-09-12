import { useEffect, useState } from "react";
import { schoolClient } from "./reading-client.mjs";
export default function SchoolAccess({ children, admin = false, staff = false }) {
  const [client,setClient] = useState(null);
  const [account,setAccount] = useState(null);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(true);
  const [retry,setRetry] = useState(0);
  useEffect(() => {
    let active=true, unsubscribe, generation=0;
    schoolClient().then(api => {
      if (!active) return;
      setClient(api);
      unsubscribe=api.watch(async user => {
        const request=++generation;
        setAccount(null); setError(""); setBusy(true);
        try {
          if (user) {
            const me=await api.request(user);
            if (active && request===generation) setAccount({user,me,api});
          }
        } catch (err) { if (active && request===generation) setError(err.message); }
        finally { if (active && request===generation) setBusy(false); }
      });
    }).catch(err => { if(active) {setError(err.message);setBusy(false);} });
    return () => {active=false;generation++;unsubscribe?.();};
  },[retry]);
  async function signIn() {
    setBusy(true);setError("");
    try {await client.signIn();} catch {setError("Sign-in did not finish. Please try again.");}
    finally {setBusy(false);}
  }
  const allowed=account && (!admin || account.me.isAdmin) && (!staff || account.me.isAdmin || account.me.canViewForms);
  return <>
    <div className="school-session">
      <span>{account ? `Signed in as ${account.me.person?.name || "Leicester High reader"}` : "School reading"}</span>
      {(account?.me.isAdmin||account?.me.canViewForms) && <a href="#/admin">Form progress</a>}
      {client && <button className="text-link" onClick={async () => {setAccount(null);try {await client.signOut();} catch {setError("Sign-out failed. Close this tab to end this session.");}}}>Sign out</button>}
    </div>
    {error && <p role="alert">{error} <button onClick={()=>{setBusy(true);setRetry(n=>n+1);}}>Try again</button></p>}
    {busy ? <p role="status">Loading school reading…</p> : allowed ? children(account) : <section className="admin-card">
      <h1>{account ? (staff?"Staff access required":"Admin access required") : "Sign in to school reading"}</h1>
      <p>{account ? (staff?"This area is for staff identified in the verified school roster.":"This area is for the authorised reading administrators.") : "Use your Leicester High Microsoft account."}</p>
      {!account && client && <button className="button primary" onClick={signIn}>Sign in with Microsoft</button>}
    </section>}
  </>;
}
