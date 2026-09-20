import { useEffect, useRef, useState } from "react";
import { schoolClient } from "./reading-client.mjs";
function SchoolLoginArt({openDay=false}) {
  if(openDay)return <div className="open-day-access-art" aria-hidden="true">
    <svg className="open-day-lanyard" viewBox="0 0 300 210"><path d="M55 0c0 98 42 126 95 184C203 126 245 98 245 0"/><path d="M72 0c0 86 39 112 78 157 39-45 78-71 78-157"/></svg>
    <div className="open-day-badge"><span>LHS OPEN DAY</span><strong>CREW</strong><small>YOUR ROLE AWAITS</small><i>★</i></div>
    <div className="open-day-map"><span>START</span><b>● · · · ➜</b><i>YOU<br/>ARE<br/>HERE</i></div>
    <div className="open-day-welcome">WELCOME!</div><div className="open-day-direction">CHECK IN <b>➜</b></div><span className="open-day-spark">✦</span>
  </div>;
  return <div className="school-login-art" aria-hidden="true"><span>ONE SCHOOL</span><i>TURN THE PAGE</i><i>READ TOGETHER</i><i>REACH HIGHER</i><b>✦</b></div>;
}
export default function SchoolAccess({ children, admin = false, staff = false, area = "reading" }) {
  const openDay=area==="open-day";
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
        {area!=="open-day" && <a href="#/open-day">My Open Day role</a>}
        {(account.me.isAdmin||account.me.canViewForms) && area!=="teacher" && <a href="#/teacher">Teacher dashboard</a>}
        {account.me.isAdmin && area!=="admin" && <a href="#/admin">Admin dashboard</a>}
      </nav>
      {account && <button className="text-link" onClick={async () => {setAccount(null);try {await client.signOut();} catch {setError("Sign-out failed. Close this tab to end this session.");}}}>Sign out</button>}
    </div>}
    {error && <p className="school-access-error" role="alert">{error} <button onClick={()=>{setBusy(true);setRetry(n=>n+1);}}>Try again</button></p>}
    {busy ? <section className="school-login-card school-login-loading" role="status"><div className="school-login-copy"><span className="eyebrow">LHS 365 · SCHOOL ACCESS</span><h1>{openDay?"Finding your mission…":"Opening reading…"}</h1></div><SchoolLoginArt openDay={openDay}/></section> : allowed ? children(account) : <section className="school-login-card">
      <div className="school-login-copy">
        <span className="eyebrow">LHS 365 · SCHOOL ACCESS</span>
        <h1>{account ? (staff?"Staff access required":"Admin access required") : openDay?"Ready for your mission?":"Ready to read?"}</h1>
        <p>{account ? (staff?"This area is for staff identified in the school roster.":"This area is for the authorised reading administrators.") : "Use your Leicester High Microsoft account."}</p>
        {!account && client && <button className="button primary school-login-button" onClick={signIn}>Continue with Microsoft <span aria-hidden="true">➜</span></button>}
      </div>
      <SchoolLoginArt openDay={openDay}/>
    </section>}
  </>;
}
