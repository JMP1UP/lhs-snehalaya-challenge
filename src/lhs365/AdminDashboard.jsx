import { useEffect, useMemo, useState } from "react";
import { adminDemo } from "./admin-demo.mjs";
import { buildReport, HOUSE_NAMES, parseRosterUpload, reportCsv, validateRoster } from "./admin.mjs";
import { liveReading } from "./reading-client.mjs";
import { checkParticipation, parseParticipationList } from "./participation.mjs";
import SchoolAccess from "./SchoolAccess";
import "./admin.css";
const number = value => value.toLocaleString("en-GB");
const AI_LIST_PROMPT=`Turn the school list I provide into JSON for a reading participation check.
Return only a JSON array. Use one object per person with exactly these fields:
{"name":"Full name","email":"school email"}
Keep names and school emails exactly as supplied. Never invent missing information; use an empty string instead. Remove headings and blank rows, but do not merge different people.
I will paste the JSON into a local school tool. Do not add commentary or Markdown fences.`;
const AI_ROSTER_PROMPT=`Turn the school roster I provide into JSON.
Return only a JSON array. Use one object per person with these fields:
{"name":"Full name","email":"school email","kind":"student or staff","house":"Beaumanor, Bradgate, Charnwood or None","yearGroup":"EYFS or Year 1–13","formGroup":"Tutor/form group","active":true}
If a name ends in (staff), set kind to staff and remove that marker from the name. Staff use yearGroup "Staff" and may use house "None". Never invent missing information. Keep school emails exact. Do not add commentary or Markdown fences.`;
const towerHeight = pages => {
  const millimetres=pages/20;
  if(millimetres>=1000)return `${(millimetres/1000).toLocaleString("en-GB",{maximumFractionDigits:2})} m`;
  if(millimetres>=10)return `${(millimetres/10).toLocaleString("en-GB",{maximumFractionDigits:1})} cm`;
  return `${millimetres.toLocaleString("en-GB",{maximumFractionDigits:1})} mm`;
};
function download(rows) {
  const url=URL.createObjectURL(new Blob(["\ufeff",reportCsv(rows)],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="reading-no-pages-logged.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function Ranking({title,rows}) {
  return <section className="admin-card"><h2>{title}</h2>{rows.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">Rank</th><th scope="col">Reader</th><th scope="col">Pages</th><th scope="col">Finished</th></tr></thead><tbody>{rows.map((person,index)=><tr key={person.id}><td>{index+1}</td><th scope="row">{person.name}<small>{person.house}{person.kind === "student" ? ` · ${person.yearGroup}` : ""}</small></th><td>{number(person.pages)}</td><td>{person.finished}</td></tr>)}</tbody></table></div> : <p>No pages logged yet.</p>}</section>;
}
function RosterImport({data,onSave,onVeracross,open=false}) {
  const [raw,setRaw]=useState(""),[draft,setDraft]=useState(null),[complete,setComplete]=useState(false),[error,setError]=useState(""),[busy,setBusy]=useState(false),[copied,setCopied]=useState(false),[sourceNote,setSourceNote]=useState(""),[skippedPupils,setSkippedPupils]=useState([]);
  const inspect=text=>{setError("");try{setDraft(parseRosterUpload(text));}catch(err){setDraft(null);setError(err.message);}};
  return <details className="admin-card roster-manager" id="roster-management" open={open || undefined}><summary>{data.people.length ? "Manage the school roster" : "Upload the school roster"}</summary>
    <p><strong>Add or update is the safe default.</strong> A later upload adds new joiners and updates matching school emails without removing anyone else.</p>
    {onVeracross&&<><button type="button" className="button primary" disabled={busy} onClick={async()=>{setBusy(true);setError("");setSourceNote("");setSkippedPupils([]);try{const preview=await onVeracross();setDraft(preview.people);setSkippedPupils(preview.skippedPupils||[]);setSourceNote(`${preview.people.length} school accounts found${preview.skipped?` · ${preview.skipped} incomplete records skipped`:""}. Check the totals, then add or update.`);}catch(err){setError(err.message);}finally{setBusy(false);}}}>{busy?"Checking…":"Check Veracross roster"}</button>{sourceNote&&<p role="status">{sourceNote}</p>}{skippedPupils.length>0&&<details className="veracross-issues"><summary>{skippedPupils.length} pupil record{skippedPupils.length===1?"":"s"} need correcting in Veracross</summary><div className="admin-table-scroll"><table><thead><tr><th scope="col">Pupil</th><th scope="col">Missing</th></tr></thead><tbody>{skippedPupils.map((pupil,index)=><tr key={`${pupil.name}-${index}`}><th scope="row">{pupil.name}</th><td>{pupil.missing.join(", ")}</td></tr>)}</tbody></table></div></details>}</>}
    <details className="ai-list-prompt"><summary>Prompt to arrange roster data with AI</summary><p>Use only an AI service approved for school personal data.</p><textarea aria-label="Roster AI prompt" readOnly value={AI_ROSTER_PROMPT}/><button type="button" className="button secondary" onClick={async()=>{try{await navigator.clipboard.writeText(AI_ROSTER_PROMPT);setCopied(true);}catch{setCopied(false);}}}>{copied?"Prompt copied":"Copy prompt"}</button></details>
    <label htmlFor="roster-file">Upload JSON, CSV or TSV</label><input id="roster-file" type="file" accept=".json,.csv,.tsv,.txt,application/json,text/csv,text/tab-separated-values,text/plain" disabled={busy} onChange={async event=>{
      setDraft(null);setComplete(false);setError("");const file=event.target.files?.[0];if(!file)return;
      try {if(file.size>500000)throw new Error("Use a roster file smaller than 500 KB.");const text=await file.text();setRaw(text);setDraft(parseRosterUpload(text));}catch(err){setError(err.message);}
    }}/>
    <label htmlFor="roster-paste">Or paste the roster</label><textarea id="roster-paste" value={raw} onChange={event=>setRaw(event.target.value)} placeholder={'Name,Email,Role,House,Year group,Form group\nAlex Example,alex.example@leicesterhigh.co.uk,student,Bradgate,Year 8,8A'}/>
    <button type="button" className="button secondary" disabled={busy} onClick={()=>inspect(raw)}>Check roster</button>
    {draft && <div className="roster-confirm"><p><strong>{draft.length} people ready to import</strong> · {draft.filter(p=>p.kind==="student").length} students · {draft.filter(p=>p.kind==="staff").length} staff · {draft.filter(p=>p.active).length} active</p>
      <p>Currently {data.people.length} people on the roster.</p>
      <button className="button primary" disabled={busy || !draft.length} onClick={async()=>{setBusy(true);setError("");try{await onSave(draft,{replace:false});setDraft(null);setRaw("");}catch(err){setError(err.message);}finally{setBusy(false);}}}>{busy ? "Saving…" : "Add or update people"}</button>
      <details className="replace-roster"><summary>Replace the complete roster</summary><p>Only use this for a complete export. Anyone omitted will lose their form and house placement, although their reading records remain.</p><label><input type="checkbox" checked={complete} disabled={busy} onChange={event=>setComplete(event.target.checked)}/> I have checked this is the complete roster.</label><button className="button secondary" disabled={busy||!complete||!draft.length} onClick={async()=>{setBusy(true);setError("");try{await onSave(draft,{replace:true,complete:true});setDraft(null);setRaw("");}catch(err){setError(err.message);}finally{setBusy(false);}}}>Replace complete roster</button></details>
    </div>}{error && <p role="alert">{error}</p>}
  </details>;
}
function FormGroupBoard({summary,groups,ownFormGroup="",complete=true}) {
  return <section className="admin-card form-board" aria-labelledby="form-board-title">
    <div className="section-heading"><div><span className="eyebrow">LIGHT COMPETITION · ALL STUDENTS</span><h2 id="form-board-title">Form group progress</h2></div><div className="school-form-summary"><strong>{number(summary.pages)}</strong><span>school pages</span><strong>{summary.rate===null?"—":`${Math.round(summary.rate)}%`}</strong><span>{complete?"school":"roster"} participation</span><strong>{summary.averagePages===null?"—":number(Math.round(summary.averagePages))}</strong><span>average per student</span></div></div>
    <div className="form-rankings">{groups.map((group,index)=><article className={`form-card${group.name===ownFormGroup?" own-form":""}`} key={group.name}><span className="form-rank">{index+1}</span><div><h3>{group.name}{group.name===ownFormGroup&&<small>Your form</small>}</h3><p><strong>{number(group.pages)}</strong> pages · {number(Math.round(group.averagePages||0))} average</p><span>{group.rate===null?"—":`${Math.round(group.rate)}%`} participating · {group.participants} of {group.enrolled}</span></div></article>)}</div>
  </section>;
}
function ParticipationCheck({data}) {
  const [raw,setRaw]=useState(""),[rows,setRows]=useState([]),[error,setError]=useState(""),[copied,setCopied]=useState(false);
  const inspect=text=>{setError("");try{setRows(checkParticipation(parseParticipationList(text),data.people,data.books));}catch(err){setRows([]);setError(err.message);}};
  const counts=rows.reduce((result,row)=>({...result,[row.state]:(result[row.state]||0)+1}),{});
  return <section className="admin-card participation-check" aria-labelledby="participation-check-title">
    <div className="participation-heading"><div><span className="eyebrow">PRIVATE STAFF CHECK</span><h2 id="participation-check-title">Who has taken part?</h2><p>Upload or paste a list. It stays in this window.</p></div>{rows.length>0&&<div className="participation-counts" aria-label="Participation check totals"><strong>{counts.participated||0}<span>Taken part</span></strong><strong>{counts["not-started"]||0}<span>Not yet</span></strong></div>}</div>
    <details className="ai-list-prompt"><summary>Prompt to tidy a list with AI</summary><p>Use only an AI service approved for school personal data. Otherwise paste CSV directly below.</p><label htmlFor="ai-list-prompt">Copy this prompt</label><textarea id="ai-list-prompt" readOnly value={AI_LIST_PROMPT}/><button type="button" className="button secondary" onClick={async()=>{try{await navigator.clipboard.writeText(AI_LIST_PROMPT);setCopied(true);}catch{setCopied(false);}}}>{copied?"Prompt copied":"Copy prompt"}</button></details>
    <div className="participation-input">
      <label htmlFor="participation-file">Upload JSON, CSV or TSV</label><input id="participation-file" type="file" accept=".json,.csv,.tsv,.txt,application/json,text/csv,text/tab-separated-values,text/plain" onChange={async event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>500000){setError("Use a file smaller than 500 KB.");return;}const text=await file.text();setRaw(text);inspect(text);}}/>
      <label htmlFor="participation-list">Or paste the list</label><textarea id="participation-list" value={raw} onChange={event=>setRaw(event.target.value)} placeholder={'Name,Email\nAlex Example,alex.example@leicesterhigh.co.uk'}/>
      <button type="button" className="button primary" onClick={()=>inspect(raw)}>Check participation</button>
      {error&&<p role="alert">{error}</p>}
    </div>
    {rows.length>0&&<div className="admin-table-scroll participation-results"><table><thead><tr><th scope="col">Person</th><th scope="col">Status</th><th scope="col">Pages</th></tr></thead><tbody>{rows.map((row,index)=><tr key={`${row.email||row.name}-${index}`}><th scope="row">{row.matchedName||row.name||row.email}</th><td><span className={`participation-status ${row.state}`}>{row.state==="participated"?"Taken part":row.state==="not-started"?"Not yet":"Check match"}</span></td><td>{row.state==="unmatched"?"—":number(row.pages)}</td></tr>)}</tbody></table></div>}
  </section>;
}
function RosterReconciliation({rows=[]}) {
  if(!rows.length)return null;
  return <section className="admin-card roster-reconciliation" aria-labelledby="roster-reconciliation-title">
    <span className="eyebrow">ACTION NEEDED · PRIVATE</span>
    <h2 id="roster-reconciliation-title">Signed in, not on the roster <small>({rows.length})</small></h2>
    <p>These valid Leicester High accounts have opened reading. Add them to the roster so their form and house participation is counted correctly.</p>
    <div className="admin-table-scroll"><table><thead><tr><th scope="col">School account</th><th scope="col">First seen</th><th scope="col">Last seen</th></tr></thead><tbody>{rows.map(row=><tr key={row.email}><th scope="row">{row.email}</th><td>{new Date(row.firstSeenAt).toLocaleString("en-GB")}</td><td>{new Date(row.lastSeenAt).toLocaleString("en-GB")}</td></tr>)}</tbody></table></div>
  </section>;
}
function Report({data,onRefresh,onSave,onVeracross,demo=false}) {
  const [house,setHouse]=useState(""),[kind,setKind]=useState(""),[yearGroup,setYear]=useState(""),[search,setSearch]=useState("");
  const result=useMemo(()=>{try{return {report:buildReport(data.people,data.books,{house,kind,yearGroup})};}catch{return {error:"Reading records could not be reconciled. Refresh or contact the administrator before using this report."};}},[data,house,kind,yearGroup]);
  if(result.error)return <p role="alert">{result.error}</p>;
  const report=result.report;
  const hasRoster=data.people.length>0;
  const notStarted=report.notStarted.filter(person=>person.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <div className="reading-admin">
    <header className="admin-heading"><div><span className="eyebrow">LHS 365 · READING {demo ? "DEMO" : "ADMIN"}</span><h1>Every page. <em>Everyone.</em></h1></div>{onRefresh && <button className="button secondary" onClick={onRefresh}>Refresh report</button>}</header>
    {demo ? <p className="admin-notice" role="status"><strong>Fictional demo</strong> · No school records</p> : <p className="admin-notice">Private staff report · {data.complete ? "Complete roster" : "Partial roster"} · Loaded {new Date(data.updatedAt).toLocaleString("en-GB")}</p>}
    {onSave && <RosterImport data={data} onSave={onSave} onVeracross={onVeracross} open={!hasRoster}/>}
    {!demo && !data.complete && hasRoster && <p>People missing from the roster cannot appear in the “No pages logged” list.</p>}
    {report.unmatchedBooks>0 && <p role="alert">{report.unmatchedBooks} book records from {report.unmatchedReaders} participating reader{report.unmatchedReaders===1?"":"s"} are included in the community tower but not in roster, form or house figures.</p>}
    <section className={`admin-celebration${report.community.pages ? "" : " is-empty"}`} aria-labelledby="community-tower-title">
      <div className="admin-celebration-copy">
        <span className="eyebrow">OUR COMMUNITY BOOK TOWER</span>
        {report.community.pages ? <><h2 id="community-tower-title"><strong>{number(report.community.pages)}</strong> pages.<br/><em>{towerHeight(report.community.pages)} high.</em></h2><p>{report.community.participants} readers · {number(report.community.finished)} books finished</p></> : <><h2 id="community-tower-title">The tower starts here.</h2><p>No pages logged yet.</p></>}
      </div>
      <div className="admin-book-stack" aria-hidden="true">
        <i>EVERY PAGE COUNTS</i><i>READ TOGETHER</i><i>ONE MORE CHAPTER</i><i>LHS 365</i><i>KEEP STACKING</i>
    </div>
    </section>
    {!hasRoster && !demo ? <RosterReconciliation rows={data.unmatchedLogins}/> : <>
    <div className="admin-filters" role="group" aria-label="Filter reading reports">
      <label>Readers<select value={kind} onChange={e=>{setKind(e.target.value);setYear("");}}><option value="">Students and staff</option><option value="student">Students</option><option value="staff">Staff</option></select></label>
      <label>House<select value={house} onChange={e=>setHouse(e.target.value)}><option value="">All houses</option>{HOUSE_NAMES.map(name=><option key={name}>{name}</option>)}<option>None</option></select></label>
      <label>Year group<select value={yearGroup} onChange={e=>setYear(e.target.value)}><option value="">All year groups</option>{[...new Set(data.people.filter(p=>!kind || p.kind===kind).map(p=>p.yearGroup))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).map(name=><option key={name}>{name}</option>)}</select></label>
    </div>
    <section className="admin-totals" aria-label="Filtered reading totals">{[[number(report.pages),"Pages stacked"],[`${report.participants} / ${report.enrolled}`,"Readers contributing"],[report.rate===null ? "—" : `${Math.round(report.rate)}%`,data.complete ? "Participation" : "Roster participation"],[number(report.finished),"Books finished"]].map(([value,label])=><div key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>
    <FormGroupBoard summary={report.studentSummary} groups={report.formGroups} complete={data.complete}/>
    {!demo&&<RosterReconciliation rows={data.unmatchedLogins}/>}
    <ParticipationCheck data={data}/>
    <section className="admin-champion"><span aria-hidden="true">★</span><div><span className="eyebrow">LEADING THE STACK · CURRENT FILTER</span><h2>{report.biggest?.name || "Who will start our tower?"}</h2><p>{report.biggest ? `${number(report.biggest.pages)} pages contributed · ${report.biggest.house}` : "The first page is all it takes."}</p></div></section>
    <div className="admin-rankings"><Ranking title="Top 10 students" rows={report.topStudents}/><Ranking title="Top 10 staff" rows={report.topStaff}/></div>
    <section className="admin-card house-leaderboard" aria-labelledby="house-leaderboard-title">
      <h2 id="house-leaderboard-title">House leaderboard</h2>
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
    </section>
    <section className="admin-card"><div className="section-heading"><h2>No pages logged <small>({report.notStarted.length})</small></h2><button className="button secondary" disabled={!notStarted.length} onClick={()=>download(notStarted)}>Export this list</button></div><p>Private staff list · Active roster members</p>
      <label htmlFor="reader-search">Find a reader</label><input id="reader-search" value={search} onChange={e=>setSearch(e.target.value)} type="search"/>
      {notStarted.length ? <div className="admin-table-scroll"><table><thead><tr><th scope="col">Reader</th><th scope="col">Role</th><th scope="col">House</th><th scope="col">Year group</th><th scope="col">Form group</th></tr></thead><tbody>{notStarted.map(person=><tr key={person.id}><th scope="row">{person.name}</th><td>{person.kind}</td><td>{person.house}</td><td>{person.yearGroup}</td><td>{person.formGroup||"—"}</td></tr>)}</tbody></table></div> : <p>{search ? "No matching readers." : "Everyone in this selection has contributed. Brilliant!"}</p>}
    </section>
    <details className="admin-footnote"><summary>How totals work</summary><p>Logging a finished book credits its full page count. Older unfinished records count only new pages. Rankings use active roster members and current filters; ties are alphabetical.</p></details>
    </>}
  </div>;
}
function LiveReport({user,api}) {
  const [data,setData]=useState(null),[error,setError]=useState(""),[revision,setRevision]=useState(0);
  useEffect(()=>{let active=true;api.request(user,"admin").then(result=>{if(active)setData(result);}).catch(err=>{if(active)setError(err.message);});return()=>{active=false;};},[user,api,revision]);
  function refresh(){setData(null);setError("");setRevision(n=>n+1);}
  if(error)return <p role="alert">{error} <button onClick={refresh}>Try again</button></p>;
  if(!data)return <p role="status">Loading private reading report…</p>;
  return <Report data={data} onRefresh={refresh} onVeracross={()=>api.request(user,"admin",{action:"veracross-preview"})} onSave={async(people,options)=>{await api.request(user,"admin",{action:options.replace?"roster":"roster-merge",people,complete:options.complete,version:data.version});refresh();}}/>;
}
function StaffReport({user,api}) {
  const [data,setData]=useState(null),[error,setError]=useState("");
  useEffect(()=>{let active=true;api.request(user,"staff").then(result=>{if(active)setData(result);}).catch(err=>{if(active)setError(err.message);});return()=>{active=false;};},[user,api]);
  if(error)return <p role="alert">{error}</p>;
  if(!data)return <p role="status">Loading form progress…</p>;
  return <div className="reading-admin staff-report"><header className="admin-heading"><div><span className="eyebrow">LHS 365 · STAFF VIEW</span><h1>Every page. <em>Every form.</em></h1></div></header><p className="admin-notice">Aggregate progress only · {data.complete?"Complete roster":"Partial roster"} · Updated {new Date(data.updatedAt).toLocaleString("en-GB")}</p><FormGroupBoard summary={data.studentSummary} groups={data.formGroups} ownFormGroup={data.formGroup} complete={data.complete}/></div>;
}
function DemoStaffReport({data,onAdmin}) {
  const report=buildReport(data.people,data.books);
  return <div className="reading-admin staff-report"><div className="preview-role-switch" aria-label="Fictional role preview"><strong>Viewing as teacher</strong><button className="button secondary" onClick={onAdmin}>View administrator</button></div><header className="admin-heading"><div><span className="eyebrow">LHS 365 · STAFF DEMO</span><h1>Every page. <em>Every form.</em></h1></div></header><p className="admin-notice"><strong>Fictional demo</strong> · Aggregate progress only</p><FormGroupBoard summary={report.studentSummary} groups={report.formGroups} ownFormGroup="8A" complete={data.complete}/></div>;
}
export default function AdminDashboard({view="admin"}) {
  const [demo,setDemo]=useState(adminDemo);
  const [demoRole,setDemoRole]=useState("admin");
  if(!liveReading){
    if(view==="teacher"||demoRole==="staff")return <DemoStaffReport data={demo} onAdmin={()=>view==="teacher"?window.location.hash="#/admin":setDemoRole("admin")}/>;
    return <><div className="preview-role-switch" aria-label="Fictional role preview"><strong>Viewing as administrator</strong><button className="button secondary" onClick={()=>setDemoRole("staff")}>View teacher</button></div><Report data={demo} demo onSave={async(people,options)=>setDemo(current=>{const incoming=validateRoster(people).map(person=>({...person,id:current.people.find(existing=>existing.email===person.email)?.id||`preview-${person.email}`}));const byId=new Map(incoming.map(person=>[person.id,person]));const merged=options.replace?incoming:[...current.people.map(person=>byId.get(person.id)||person),...incoming.filter(person=>!current.people.some(existing=>existing.id===person.id))];return {...current,people:merged,complete:options.replace?true:current.complete,updatedAt:"Fictional demonstration"};})}/></>;
  }
  if(view==="teacher")return <SchoolAccess staff area="teacher">{({user,api})=><StaffReport key={user.uid} user={user} api={api}/>}</SchoolAccess>;
  return <SchoolAccess admin area="admin">{({user,api})=><LiveReport key={user.uid} user={user} api={api}/>}</SchoolAccess>;
}
