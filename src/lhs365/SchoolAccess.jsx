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
    {account && <div className="school-session">
      <span>{`Signed in as ${account.me.person?.name || "Leicester High reader"}`}</span>
      {(account?.me.isAdmin||account?.me.canViewForms) && <a href="#/admin">Form progress</a>}
      {account && <button className="text-link" onClick={async () => {setAccount(null);try {await client.signOut();} catch {setError("Sign-out failed. Close this tab to end this session.");}}}>Sign out</button>}
    </div>}
    {error && <p className="school-access-error" role="alert">{error} <button onClick={()=>{setBusy(true);setRetry(n=>n+1);}}>Try again</button></p>}
    {busy ? <p className="school-access-loading" role="status">Opening school reading…</p> : allowed ? children(account) : <section className="school-login-card">
      <div className="school-login-copy">
        <span className="eyebrow">LHS 365 · SCHOOL ACCESS</span>
        <h1>{account ? (staff?"Staff access required":"Admin access required") : "Ready to read?"}</h1>
        <p>{account ? (staff?"This area is for staff identified in the school roster.":"This area is for the authorised reading administrators.") : "Use your Leicester High Microsoft account."}</p>
        {!account && client && <button className="button primary school-login-button" onClick={signIn}>Continue with Microsoft <span aria-hidden="true">➜</span></button>}
      </div>
      <div className="school-login-art" aria-hidden="true"><span>ONE SCHOOL</span><i>TURN THE PAGE</i><i>READ TOGETHER</i><i>REACH HIGHER</i><b>✦</b></div>
    </section>}
  </>;
}
