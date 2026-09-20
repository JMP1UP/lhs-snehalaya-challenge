import { useEffect, useRef, useState } from "react";
import SchoolAccess from "./SchoolAccess";
import { liveReading } from "./reading-client.mjs";

const previewAssignment={role:"Tour Guide",time:"9:00 am",location:"Main Hall",lead:"Ms Example",instructions:"Collect your route, welcome your family and show them the school with confidence."};

function MissionArt({role}) {
  const subject=/subject/i.test(role),tour=/tour/i.test(role);
  return <div className={`mission-art ${subject?"subject":tour?"tour":"welcome"}`} aria-hidden="true">
    <span className="mission-burst">YOUR<br/>MISSION</span>
    <div className="mission-character"><i/><b>{subject?"A+":tour?"↗":"★"}</b></div>
    <span className="mission-zap">✦</span><span className="mission-pop">LET'S GO!</span>
  </div>;
}

function Assignment({assignment,name,preview=false}) {
  const [revealed,setRevealed]=useState(false),heading=useRef(null);
  useEffect(()=>{if(revealed)heading.current?.focus();},[revealed]);
  if(!assignment)return <section className="mission-empty"><span className="eyebrow">OPEN DAY · YOUR ROLE</span><h1>Your mission is still being prepared.</h1><p>Check back later, or ask your form teacher if you expected to see a role.</p></section>;
  if(!revealed)return <section className="mission-sealed" aria-labelledby="mission-sealed-title">
    <div className="sealed-card" aria-hidden="true"><span>TOP SECRET</span><b>?</b><i>LHS OPEN DAY</i></div>
    <div><span className="eyebrow">OPEN DAY · {preview?"FICTIONAL PREVIEW":"PRIVATE BRIEFING"}</span><h1 id="mission-sealed-title">{name?`${name}, your`:"Your"} mission is ready.</h1><p>One tap. Big reveal.</p><button className="button mission-reveal-button" onClick={()=>setRevealed(true)}>Reveal my role <span aria-hidden="true">✦</span></button></div>
  </section>;
  return <section className="mission-reveal" aria-live="polite">
    <div className="mission-confetti" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <div className="mission-briefing">
      <span className="eyebrow">OPEN DAY · MISSION REVEALED</span>
      <h1 ref={heading} tabIndex={-1}>You are a<br/><em>{assignment.role}</em></h1>
      <dl>
        {assignment.time&&<div><dt>When</dt><dd>{assignment.time}</dd></div>}
        {assignment.location&&<div><dt>Meet at</dt><dd>{assignment.location}</dd></div>}
        {assignment.lead&&<div><dt>Your staff lead</dt><dd>{assignment.lead}</dd></div>}
      </dl>
      {assignment.instructions&&<div className="mission-instructions"><span>YOUR BRIEFING</span><p>{assignment.instructions}</p></div>}
      <p className="mission-finale">Be welcoming. Be curious. Be proudly LHS.</p>
    </div>
    <MissionArt role={assignment.role}/>
  </section>;
}

export default function OpenDayMission(){
  if(!liveReading)return <Assignment assignment={previewAssignment} name="Alex" preview/>;
  return <SchoolAccess area="open-day">{({user,me})=><Assignment key={user.uid} assignment={me.person?.openDay||null} name={me.person?.name||""}/>}</SchoolAccess>;
}
