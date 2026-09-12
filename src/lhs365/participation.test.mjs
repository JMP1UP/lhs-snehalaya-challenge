import test from "node:test";
import assert from "node:assert/strict";
import { checkParticipation, parseParticipationList } from "./participation.mjs";

test("participation lists accept JSON and simple CSV without duplicate people",()=>{
  assert.deepEqual(parseParticipationList('[{"name":"A Pupil","email":"a@leicesterhigh.co.uk"}]'),[{name:"A Pupil",email:"a@leicesterhigh.co.uk"}]);
  assert.deepEqual(parseParticipationList('Name,Email\nA Pupil,a@leicesterhigh.co.uk\nA Pupil,a@leicesterhigh.co.uk'),[{name:"A Pupil",email:"a@leicesterhigh.co.uk"}]);
});

test("participation checking distinguishes contributed, not started and unmatched",()=>{
  const roster=[{id:"a",name:"A Pupil",email:"a@leicesterhigh.co.uk"},{id:"b",name:"B Pupil",email:"b@leicesterhigh.co.uk"}];
  const books=[{id:"book-a",ownerKey:"a",title:"Book",author:"",total:100,start:10,current:30,logs:[{pages:30,date:"2026-09-12"}]}];
  const rows=checkParticipation([{name:"A Pupil",email:""},{name:"B Pupil",email:""},{name:"Missing",email:""}],roster,books);
  assert.deepEqual(rows.map(row=>[row.state,row.pages]),[["participated",20],["not-started",0],["unmatched",0]]);
});

test("participation input rejects external email addresses",()=>{
  assert.throws(()=>parseParticipationList('Name,Email\nSomeone,someone@example.com'),/Leicester High/);
});
