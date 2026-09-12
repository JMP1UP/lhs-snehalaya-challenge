import { useEffect, useRef, useState } from "react";
import { schoolClient } from "./reading-client.mjs";
function SchoolLoginArt() {
  return <div className="school-login-art" aria-hidden="true"><span>ONE SCHOOL</span><i>TURN THE PAGE</i><i>READ TOGETHER</i><i>REACH HIGHER</i><b>✦</b></div>;
}
export default function SchoolAccess({ children, admin = false, staff = false, area = "reading" }) {
  const [client,setClient] = useState(null);
  const [account,setAccount] = useState(null);
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(true);
  const [retry,setRetry] = useState(0);
  const wasAllowed=useRef(false);
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
  useEffect(() => {
    if (allowed && !wasAllowed.current) window.scrollTo(0,0);
    wasAllowed.current=Boolean(allowed);
  },[allowed]);
  return <>
    {account && <div className="school-session">
      <span>{account.me.person?.name ? `Signed in as ${account.me.person.name}` : "Signed in with Microsoft"}</span>
      <nav className="school-view-links" aria-label="School reading views">
        {area!=="reading" && <a href="#/reading">My reading</a>}
        {(account.me.isAdmin||account.me.canViewForms) && area!=="teacher" && <a href="#/teacher">Teacher dashboard</a>}
        {account.me.isAdmin && area!=="admin" && <a href="#/admin">Admin dashboard</a>}
      </nav>
      {account && <button className="text-link" onClick={async () => {setAccount(null);try {await client.signOut();} catch {setError("Sign-out failed. Close this tab to end this session.");}}}>Sign out</button>}
    </div>}
    {error && <p className="school-access-error" role="alert">{error} <button onClick={()=>{setBusy(true);setRetry(n=>n+1);}}>Try again</button></p>}
    {busy ? <section className="school-login-card school-login-loading" role="status"><div className="school-login-copy"><span className="eyebrow">LHS 365 · SCHOOL ACCESS</span><h1>Opening reading…</h1></div><SchoolLoginArt /></section> : allowed ? children(account) : <section className="school-login-card">
      <div className="school-login-copy">
        <span className="eyebrow">LHS 365 · SCHOOL ACCESS</span>
        <h1>{account ? (staff?"Staff access required":"Admin access required") : "Ready to read?"}</h1>
        <p>{account ? (staff?"This area is for staff identified in the school roster.":"This area is for the authorised reading administrators.") : "Use your Leicester High Microsoft account."}</p>
        {!account && client && <button className="button primary school-login-button" onClick={signIn}>Continue with Microsoft <span aria-hidden="true">➜</span></button>}
      </div>
      <SchoolLoginArt />
    </section>}
  </>;
}
