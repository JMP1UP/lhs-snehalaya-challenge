import { useEffect, useMemo, useState } from "react";
import { adminDemo } from "./admin-demo.mjs";
import { buildReport, HOUSE_NAMES, reportCsv, validateRoster } from "./admin.mjs";
import { liveReading } from "./reading-client.mjs";
import SchoolAccess from "./SchoolAccess";
import "./admin.css";
const number = value => value.toLocaleString("en-GB");
function download(rows) {
  const url=URL.createObjectURL(new Blob(["\ufeff",reportCsv(rows)],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="reading-no-pages-logged.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function Ranking({title,rows}) {
  return <section className="admin-card"><h2>{title}</h2>{rows.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">Rank</th><th scope="col">Reader</th><th scope="col">Pages</th><th scope="col">Finished</th></tr></thead><tbody>{rows.map((person,index)=><tr key={person.id}><td>{index+1}</td><th scope="row">{person.name}<small>{person.house}{person.kind === "student" ? ` · ${person.yearGroup}` : ""}</small></th><td>{number(person.pages)}</td><td>{person.finished}</td></tr>)}</tbody></table></div> : <p>No pages logged yet.</p>}</section>;
}
function RosterImport({data,onSave}) {
  const [draft,setDraft]=useState(null),[complete,setComplete]=useState(false),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  return <details className="admin-card"><summary>Manage the school roster</summary>
    <p>Upload a JSON roster with name, school email, kind (student or staff), house, yearGroup and optional active (true or false). Students need EYFS or Year 1–13; staff may use house “None”.</p>
    <p>Import replaces roster membership, but retains reading records. People omitted or marked inactive lose access to logging and are excluded from active rankings.</p>
    <label htmlFor="roster-file">Choose roster JSON</label><input id="roster-file" type="file" accept=".json,application/json" disabled={busy} onChange={async event=>{
      setDraft(null);setComplete(false);setError("");const file=event.target.files?.[0];if(!file)return;
      try {if(file.size>500000)throw new Error("Use a roster file smaller than 500 KB.");setDraft(validateRoster(JSON.parse(await file.text())));}catch(err){setError(err.message);}
    }}/>
    {draft && <div className="roster-confirm"><p><strong>{draft.length} people ready to import</strong> · {draft.filter(p=>p.kind==="student").length} students · {draft.filter(p=>p.kind==="staff").length} staff · {draft.filter(p=>p.active).length} active</p>
      <p>Currently {data.people.length} people on the roster.</p>
      <label><input type="checkbox" checked={complete} disabled={busy} onChange={event=>setComplete(event.target.checked)}/> This is the complete roster for this challenge.</label>
      <button className="button primary" disabled={busy || !draft.length} onClick={async()=>{setBusy(true);setError("");try{await onSave(draft,complete);setDraft(null);}catch(err){setError(err.message);}finally{setBusy(false);}}}>{busy ? "Importing…" : "Replace roster with this file"}</button>
    </div>}{error && <p role="alert">{error}</p>}
  </details>;
}
function Report({data,onRefresh,onSave,demo=false}) {
  const [house,setHouse]=useState(""),[kind,setKind]=useState(""),[yearGroup,setYear]=useState(""),[search,setSearch]=useState("");
  const result=useMemo(()=>{try{return {report:buildReport(data.people,data.books,{house,kind,yearGroup})};}catch{return {error:"Reading records could not be reconciled. Refresh or contact the administrator before using this report."};}},[data,house,kind,yearGroup]);
  if(result.error)return <p role="alert">{result.error}</p>;
  const report=result.report;
  const notStarted=report.notStarted.filter(person=>person.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="reading-admin">
    <header className="admin-heading"><div><span className="eyebrow">LHS 365 · READING {demo ? "DEMO" : "ADMIN"}</span><h1>Every page. <em>Everyone.</em></h1><p>See who’s stacking — and who needs a nudge.</p></div>{onRefresh && <button className="button secondary" onClick={onRefresh}>Refresh report</button>}</header>
    {demo ? <p className="admin-notice" role="status"><strong>Fictional demonstration.</strong> These are sample readers, not school records. Live reports require school sign-in and an uploaded roster.</p> : <p className="admin-notice">Private staff report · {data.complete ? "Complete roster supplied" : "Partial roster — participation covers uploaded members only"} · Loaded {new Date(data.updatedAt).toLocaleString("en-GB")}</p>}
    {!demo && !data.complete && <p>People missing from the roster cannot appear in the “No pages logged” list.</p>}
    {report.unmatchedBooks>0 && <p role="alert">{report.unmatchedBooks} book records have no matching roster member and are excluded. Check the roster before using totals.</p>}
    <div className="admin-filters" role="group" aria-label="Filter reading reports">
      <label>Readers<select value={kind} onChange={e=>{setKind(e.target.value);setYear("");}}><option value="">Students and staff</option><option value="student">Students</option><option value="staff">Staff</option></select></label>
      <label>House<select value={house} onChange={e=>setHouse(e.target.value)}><option value="">All houses</option>{HOUSE_NAMES.map(name=><option key={name}>{name}</option>)}<option>None</option></select></label>
      <label>Year group<select value={yearGroup} onChange={e=>setYear(e.target.value)}><option value="">All year groups</option>{[...new Set(data.people.filter(p=>!kind || p.kind===kind).map(p=>p.yearGroup))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(name=><option key={name}>{name}</option>)}</select></label>
    </div>
    <section className="admin-totals" aria-label="Filtered reading totals">{[[number(report.pages),"Pages stacked"],[`${report.participants} / ${report.enrolled}`,"Readers contributing"],[report.rate===null ? "—" : `${Math.round(report.rate)}%`,data.complete ? "Participation" : "Roster participation"],[number(report.finished),"Books finished"]].map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>
    <section className="admin-champion"><span aria-hidden="true">★</span><div><span className="eyebrow">LEADING THE STACK · CURRENT FILTER</span><h2>{report.biggest?.name || "Who will start our tower?"}</h2><p>{report.biggest ? `${number(report.biggest.pages)} pages contributed · ${report.biggest.house}` : "The first page is all it takes."}</p></div></section>
    <div className="admin-rankings"><Ranking title="Top 10 students" rows={report.topStudents}/><Ranking title="Top 10 staff" rows={report.topStaff}/></div>
    <section className="admin-card house-leaderboard" aria-labelledby="house-leaderboard-title">
      <h2 id="house-leaderboard-title">House leaderboard</h2>
      <p className="house-intro">Every page adds up.</p>
      <div className="house-rankings">
        {report.houses.map((item,index)=><div className="house-card" key={item.id}>
          <div className="house-card-heading">
            <span className="house-position" aria-label={`Rank ${index+1}`}>{index+1}</span>
            <h3>{item.name}</h3>
          </div>
          <p className="house-page-total"><strong>{number(item.pages)}</strong><span>pages</span></p>
          <progress max={Math.max(1,...report.houses.map(h=>h.pages))} value={item.pages} aria-label={`${item.name} pages compared with leading house`}/>
          <div className="house-participation"><span>{item.participants} of {item.enrolled} readers</span><strong>{item.rate===null ? "—" : `${Math.round(item.rate)}%`}</strong></div>
        </div>)}
      </div>
      <p className="house-caption">Ranked by pages · Participation is based on the active roster.</p>
    </section>
    <section className="admin-card"><div className="section-heading"><h2>No pages logged <small>({report.notStarted.length})</small></h2><button className="button secondary" disabled={!notStarted.length} onClick={()=>download(notStarted)}>Export this list</button></div><p>Active roster members with no new pages, including those who haven’t signed in or have only added a book. This list stays in the admin area.</p>
      <label htmlFor="reader-search">Find a reader</label><input id="reader-search" value={search} onChange={e=>setSearch(e.target.value)} type="search"/>
      {notStarted.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">Reader</th><th scope="col">Role</th><th scope="col">House</th><th scope="col">Year group</th></tr></thead><tbody>{notStarted.map(person=><tr key={person.id}><th scope="row">{person.name}</th><td>{person.kind}</td><td>{person.house}</td><td>{person.yearGroup}</td></tr>)}</tbody></table></div> : <p>{search ? "No matching readers." : "Everyone in this selection has contributed. Brilliant!"}</p>}
    </section>
    {onSave && <RosterImport data={data} onSave={onSave}/>}
    <p className="admin-footnote">Pages count from each book’s starting page. Reading days are distinct dates with new pages. Rankings use active roster members and your current filters; ties are alphabetical. An added book alone is not a contribution.</p>
  </div>;
}
function LiveReport({user,api}) {
  const [data,setData]=useState(null),[error,setError]=useState(""),[revision,setRevision]=useState(0);
  useEffect(()=>{let active=true;api.request(user,"admin").then(result=>{if(active)setData(result);}).catch(err=>{if(active)setError(err.message);});return()=>{active=false;};},[user,api,revision]);
  function refresh(){setData(null);setError("");setRevision(n=>n+1);}
  if(error)return <p role="alert">{error} <button onClick={refresh}>Try again</button></p>;
  if(!data)return <p role="status">Loading private reading report…</p>;
  return <Report data={data} onRefresh={refresh} onSave={async(people,complete)=>{await api.request(user,"admin",{action:"roster",people,complete,version:data.version});refresh();}}/>;
}
export default function AdminDashboard() {
  const [demo]=useState(adminDemo);
  if(!liveReading)return <Report data={demo} demo/>;
  return <SchoolAccess admin>{({user,api})=><LiveReport key={user.uid} user={user} api={api}/>}</SchoolAccess>;
}
