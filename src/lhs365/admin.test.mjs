import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReport,validateRoster,reportCsv,mergeRoster,replaceRoster,parseOpenDayMatrix,parseRosterUpload} from './admin.mjs';
import {adminDemo} from './admin-demo.mjs';
import {createBook,updateBook} from './reading.mjs';
test('rankings separate roles, cap at ten and reconcile pages and houses',()=>{
 const {people,books}=adminDemo(); const report=buildReport(people,books);
 assert.equal(report.topStudents.length,10);assert.equal(report.topStaff.length,10);
 assert.ok(report.topStudents.every(p=>p.kind==='student'));assert.ok(report.topStaff.every(p=>p.kind==='staff'));
 assert.equal(report.participants,32);assert.equal(report.notStarted.length,8);assert.equal(report.rate,80);
 assert.equal(report.houses.reduce((sum,h)=>sum+h.pages,0),report.pages);
 assert.equal(report.houses.reduce((sum,h)=>sum+h.enrolled,0),report.enrolled);
 assert.equal(report.formGroups.reduce((sum,form)=>sum+form.enrolled,0),28);
 assert.equal(report.studentSummary.averagePages,report.studentSummary.pages/28);
 assert.ok(report.formGroups.every(form=>form.rate>=0&&form.rate<=100));
 assert.ok(report.topStudents.every((p,i,all)=>i===0 || all[i-1].pages>=p.pages));
});
test('never signed in and added-only members are non-contributors; baseline excluded',()=>{
 const people=[{id:'a',name:'A',kind:'student',house:'Bradgate',yearGroup:'Year 8',formGroup:'8A'},{id:'b',name:'B',kind:'staff',house:'None',formGroup:'8A'},{id:'c',name:'C',kind:'staff',house:'None',formGroup:''}];
 const first={...updateBook(createBook({title:'Book',author:'',total:100,start:50},'one'),75,'2026-09-09'),ownerKey:'a'};
 const added={...createBook({title:'Book',author:'',total:100,start:50},'two'),ownerKey:'b'};
 const report=buildReport(people,[first,added]);assert.equal(report.pages,25);assert.deepEqual(report.notStarted.map(p=>p.id),['b','c']);
 assert.equal(buildReport(people,[first,added],{kind:'staff'}).pages,0);
 assert.equal(buildReport(people,[first,added],{house:'Bradgate',yearGroup:'Year 8'}).enrolled,1);
});
test('unmatched and inactive records cannot inflate active totals; corrupt or duplicate books fail',()=>{
 const {people,books}=adminDemo();people[1].active=false;const removed=people.pop();const report=buildReport(people,books);
 assert.equal(report.enrolled,38);assert.equal(report.unmatchedBooks,books.filter(b=>b.ownerKey===removed.id).length);
 assert.throws(()=>buildReport(people,[books[0],books[0]]),/Duplicate/);
 assert.throws(()=>buildReport(people,[{...books[0],current:0}]),/history|number/);
 assert.equal(buildReport([],[]).rate,null);
});
test('roster rejects duplicates, external email, missing year, invalid house and nonboolean active',()=>{
 const row={email:'fictional@leicesterhigh.co.uk',name:'Example',kind:'student',house:'Bradgate',yearGroup:'Year 8',formGroup:'8A'};
 assert.equal(validateRoster([row])[0].active,true);
 for(const patch of [{email:'person@example.com'},{yearGroup:''},{house:'Invalid'},{active:'false'},{kind:'admin'}])assert.throws(()=>validateRoster([{...row,...patch}]));
 assert.throws(()=>validateRoster([row,{...row,email:row.email.toUpperCase()}]));
 assert.throws(()=>validateRoster({}));assert.throws(()=>validateRoster(Array(1001).fill(row)));
});
test('community tower includes verified readers outside the roster without changing roster participation',()=>{
 const roster=[{id:'known',name:'Known',kind:'student',house:'Bradgate',yearGroup:'Year 8',formGroup:'8A',active:true}];
 const books=[{id:'known-book',ownerKey:'known',title:'A',author:'',total:100,start:0,current:20,finished:false,logs:[{date:'2026-09-12',pages:20}]},{id:'other-book',ownerKey:'other',title:'B',author:'',total:100,start:0,current:30,finished:false,logs:[{date:'2026-09-12',pages:30}]}];
 const report=buildReport(roster,books);
 assert.equal(report.pages,20);assert.equal(report.participants,1);assert.deepEqual(report.community,{pages:50,participants:2,finished:0});assert.equal(report.unmatchedReaders,1);
});
test('family books count in the community without appearing as roster errors',()=>{
 const family={...updateBook(createBook({title:'Family book',author:'',total:120,start:0},'family-one'),120,'2026-09-14'),ownerKey:'family:home:reader',householdId:'home',familyReaderId:'reader'};
 const report=buildReport([], [family]);
 assert.equal(report.community.pages,120);assert.equal(report.community.participants,1);assert.equal(report.unmatchedBooks,0);assert.equal(report.unmatchedReaders,0);
});
test('roster merges preserve existing pupils, update matches and add joiners',()=>{
 const existing=[{id:'a',email:'a@leicesterhigh.co.uk',name:'A',formGroup:'8A'},{id:'b',email:'b@leicesterhigh.co.uk',name:'B',formGroup:'8B'}];
 const incoming=[{id:'b',email:'b@leicesterhigh.co.uk',name:'B Updated',formGroup:'8C'},{id:'c',email:'c@leicesterhigh.co.uk',name:'C',formGroup:'8C'}];
 assert.deepEqual(mergeRoster(existing,incoming).map(p=>[p.id,p.name,p.formGroup]),[['a','A','8A'],['b','B Updated','8C'],['c','C','8C']]);
});
test('CSV roster imports form groups and recognises the staff name marker',()=>{
 const rows=parseRosterUpload('Name,Email,House,Year group,Form group\nExample Pupil,pupil@leicesterhigh.co.uk,Bradgate,Year 8,8A\nJamie Example (staff),teacher@leicesterhigh.co.uk,None,,8A');
 assert.deepEqual(rows.map(row=>[row.name,row.kind,row.formGroup]),[['Example Pupil','student','8A'],['Jamie Example','staff','8A']]);
 assert.throws(()=>parseRosterUpload('Name,Email\nPupil,pupil@leicesterhigh.co.uk'),/roster row/i);
});
test('Open Day assignments import safely and ordinary roster updates preserve them',()=>{
 const assigned=parseRosterUpload('Name,Email,House,Year group,Form group,Open Day role,Open Day time,Open Day meeting point,Open Day staff lead,Open Day instructions\nExample Pupil,pupil@leicesterhigh.co.uk,Bradgate,Year 8,8A,Tour Guide,9:00 am,Main Hall,Ms Example,Collect a route');
 assert.deepEqual(assigned[0].openDay,{role:'Tour Guide',time:'9:00 am',location:'Main Hall',lead:'Ms Example',instructions:'Collect a route'});
 const current=[{id:'pupil',...assigned[0]}],ordinary=[{id:'pupil',...validateRoster([{email:'pupil@leicesterhigh.co.uk',name:'Updated Pupil',kind:'student',house:'Bradgate',yearGroup:'Year 8',formGroup:'8B'}])[0]}];
 assert.equal(mergeRoster(current,ordinary)[0].openDay.role,'Tour Guide');
 assert.equal(replaceRoster(current,ordinary)[0].openDay.role,'Tour Guide');
 assert.equal(validateRoster([{...assigned[0],openDayRole:'CLEAR',openDay:undefined}])[0].openDay,null);
 assert.throws(()=>validateRoster([{...assigned[0],openDay:{role:'x'.repeat(101)}}]),/Open Day role/);
});
test('Open Day matrix creates individual messages and isolates ambiguous rows',()=>{
 const matrix=[
  ['Full Name','Year Group','Reg Group','Tour Guide','Geography / Business Studies','','Subject','Lead Member of Staff','Where to go on Saturday','What you will be doing'],
  ['Example, Alice','Year 8','8A','Y','','','Subject','Lead Member of Staff','Where to go on Saturday','What you will be doing'],
  ['Example, Bob','Year 9','9A','','Y','','Tour Guide','Mrs Guide','Student Foyer','Welcome and guide visitors.'],
  ['Example, Cara','Year 10','10A','Y','Y','','Geography','Mrs Geo','Room 4','Showcase Geography.'],
  ['Example, Dana','Year 11','11A','',''],
  ['Missing, Pupil','Year 7','7A','Y',''],
 ].map(row=>row.join('\t')).join('\n');
 const roster=['Alice Example','Bob Example','Cara Example','Dana Example'].map((name,index)=>({id:`p${index}`,name,email:`p${index}@leicesterhigh.co.uk`,kind:'student',house:'Bradgate',yearGroup:`Year ${index+8}`,formGroup:`${index+8}A`,active:true}));
 const result=parseOpenDayMatrix(matrix,roster);
 assert.equal(result.total,5);assert.equal(result.people.length,2);assert.equal(result.issues.length,3);
 assert.deepEqual(result.people.map(person=>person.openDay),[
  {role:'Tour Guide',time:'',location:'Student Foyer',lead:'Mrs Guide',instructions:'Welcome and guide visitors.'},
  {role:'Subject Helper - Geography',time:'',location:'Room 4',lead:'Mrs Geo',instructions:'Showcase Geography.'},
 ]);
 assert.match(result.issues.find(issue=>issue.name==='Example, Cara').issue,/More than one role/);
 assert.match(result.issues.find(issue=>issue.name==='Example, Dana').issue,/No role/);
 assert.match(result.issues.find(issue=>issue.name==='Missing, Pupil').issue,/not found/i);
});
test('Open Day matrix supports personal notes and reports roster pupils omitted from the table',()=>{
 const matrix=[
  ['Full Name','Year Group','Reg Group','Tour Guide','Personal message','','Subject','Lead Member of Staff','Where to go on Saturday','What you will be doing'],
  ['Example, Alice','Year 8','8A','','Thank you for supporting our school.','','Subject','Lead Member of Staff','Where to go on Saturday','What you will be doing'],
  ['','','','','','','Tour Guide','Mrs Guide','Student Foyer','Welcome and guide visitors.'],
 ].map(row=>row.join('\t')).join('\n');
 const roster=[
  {id:'alice',name:'Alice Example',email:'alice@leicesterhigh.co.uk',kind:'student',house:'Bradgate',yearGroup:'Year 8',formGroup:'8A',active:true},
  {id:'bob',name:'Bob Example',email:'bob@leicesterhigh.co.uk',kind:'student',house:'Bradgate',yearGroup:'Year 9',formGroup:'9A',active:true},
 ];
 const result=parseOpenDayMatrix(matrix,roster);
 assert.deepEqual(result.people[0].openDay,{role:'A note for you',time:'',location:'',lead:'',instructions:'Thank you for supporting our school.'});
 assert.match(result.issues.find(issue=>issue.name==='Bob Example').issue,/Not included/);
});
test('CSV escapes quotes, line breaks and spreadsheet formulas',()=>{
 const csv=reportCsv([{name:'=HYPERLINK("x")',kind:'staff',house:'None'},{name:'Line\nbreak'}]);
 assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));assert.ok(csv.includes('"Line\nbreak"'));
});
