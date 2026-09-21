import { useEffect, useRef, useState } from "react";
import SchoolAccess from "./SchoolAccess";
import { liveReading } from "./reading-client.mjs";

const previewAssignment={role:"Tour Guide",time:"9:00 am",location:"Main Hall",lead:"Ms Example",instructions:"Collect your route, welcome your family and show them the school with confidence."};

function MissionArt({role}) {
  const subject=/subject/i.test(role),tour=/tour/i.test(role),personalNote=role==="A note for you";
  return <div className={`mission-art ${subject?"subject":tour?"tour":"welcome"}`} aria-hidden="true">
    <span className="mission-burst">OPENED!</span>
    <div className="role-envelope role-envelope-revealed">
      <div className="role-envelope-letter"><span>{personalNote?"A MESSAGE FOR YOU":"YOUR OPEN DAY ROLE"}</span><b>{role}</b><i>{subject?"A+":tour?"↗":"★"}</i></div>
      <div className="role-envelope-paper"/><div className="role-envelope-flap"/>
    </div>
    <span className="mission-pop">LET'S GO!</span>
  </div>;
}

function Assignment({assignment,name,preview=false,isStaff=false}) {
  const [revealed,setRevealed]=useState(false),[opening,setOpening]=useState(false),heading=useRef(null);
  const personalNote=assignment?.role==="A note for you";
  useEffect(()=>{if(revealed)heading.current?.focus();},[revealed]);
  useEffect(()=>{if(!opening)return undefined;const timer=setTimeout(()=>setRevealed(true),650);return()=>clearTimeout(timer);},[opening]);
  if(!assignment)return isStaff
    ? <section className="mission-empty"><span className="eyebrow">OPEN DAY · THANK YOU</span><h1>Thank you for supporting Open Day.</h1><p>Thank you for helping new families get to know us—and for helping our current students enjoy their day.</p></section>
    : <section className="mission-empty"><span className="eyebrow">OPEN DAY · YOUR ROLE</span><h1>Your mission is still being prepared.</h1><p>Check back later, or ask your form teacher if you expected to see a role.</p></section>;
  if(!revealed)return <section className="mission-sealed" aria-labelledby="mission-sealed-title">
    <div className={`role-envelope role-envelope-large${opening?" opening":""}`} aria-hidden="true">
      <div className="role-envelope-letter"><span>LHS OPEN DAY</span><b>{name?`For ${name}`:"Your role"}</b><i>✦</i></div>
      <div className="role-envelope-paper"/><div className="role-envelope-flap"/><strong>LHS</strong>
    </div>
    <div><span className="eyebrow">OPEN DAY · {preview?"FICTIONAL PREVIEW":"PRIVATE BRIEFING"}</span><h1 id="mission-sealed-title">{personalNote?(name?`${name}, a message has arrived.`:"A message has arrived."):`${name?`${name}, your`:"Your"} role has arrived.`}</h1><p>Open it when you're ready.</p><button className="button mission-reveal-button" onClick={()=>setOpening(true)} disabled={opening}>{opening?"Opening…":"Open my envelope"} <span aria-hidden="true">✦</span></button></div>
  </section>;
  return <section className="mission-reveal" aria-live="polite">
    <div className="mission-confetti" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
    <div className="mission-briefing">
      <span className="eyebrow">OPEN DAY · {personalNote?"A MESSAGE FOR YOU":"MISSION REVEALED"}</span>
      <h1 ref={heading} tabIndex={-1}>{personalNote?<em>A note for you.</em>:<>You are a<br/><em>{assignment.role}</em></>}</h1>
      <dl>
        {assignment.time&&<div><dt>When</dt><dd>{assignment.time}</dd></div>}
        {assignment.location&&<div><dt>Meet at</dt><dd>{assignment.location}</dd></div>}
        {assignment.lead&&<div><dt>Your staff lead</dt><dd>{assignment.lead}</dd></div>}
      </dl>
      {assignment.instructions&&<div className="mission-instructions"><span>{personalNote?"FROM LEICESTER HIGH":"YOUR BRIEFING"}</span><p>{assignment.instructions}</p></div>}
      {!personalNote&&<p className="mission-finale">Be welcoming. Be curious. Be proudly LHS.</p>}
    </div>
    <MissionArt role={assignment.role}/>
  </section>;
}

export default function OpenDayMission(){
  if(!liveReading)return <Assignment assignment={previewAssignment} name="Alex" preview/>;
  return <SchoolAccess area="open-day">{({user,me})=><Assignment key={user.uid} assignment={me.person?.openDay||null} name={me.person?.name||""} isStaff={me.person?.kind==="staff"}/>}</SchoolAccess>;
}
