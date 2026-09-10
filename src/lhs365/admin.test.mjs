import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReport,validateRoster,reportCsv} from './admin.mjs';
import {adminDemo} from './admin-demo.mjs';
import {createBook,updateBook} from './reading.mjs';
test('rankings separate roles, cap at ten and reconcile pages and houses',()=>{
 const {people,books}=adminDemo(); const report=buildReport(people,books);
 assert.equal(report.topStudents.length,10);assert.equal(report.topStaff.length,10);
 assert.ok(report.topStudents.every(p=>p.kind==='student'));assert.ok(report.topStaff.every(p=>p.kind==='staff'));
 assert.equal(report.participants,32);assert.equal(report.notStarted.length,8);assert.equal(report.rate,80);
 assert.equal(report.houses.reduce((sum,h)=>sum+h.pages,0),report.pages);
 assert.equal(report.houses.reduce((sum,h)=>sum+h.enrolled,0),report.enrolled);
 assert.ok(report.topStudents.every((p,i,all)=>i===0 || all[i-1].pages>=p.pages));
});
test('never signed in and added-only members are non-contributors; baseline excluded',()=>{
 const people=[{id:'a',name:'A',kind:'student',house:'Bradgate',yearGroup:'Year 8'},{id:'b',name:'B',kind:'staff',house:'None'},{id:'c',name:'C',kind:'staff',house:'None'}];
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
 const row={email:'fictional@leicesterhigh.co.uk',name:'Example',kind:'student',house:'Bradgate',yearGroup:'Year 8'};
 assert.equal(validateRoster([row])[0].active,true);
 for(const patch of [{email:'person@example.com'},{yearGroup:''},{house:'Invalid'},{active:'false'},{kind:'admin'}])assert.throws(()=>validateRoster([{...row,...patch}]));
 assert.throws(()=>validateRoster([row,{...row,email:row.email.toUpperCase()}]));
 assert.throws(()=>validateRoster({}));assert.throws(()=>validateRoster(Array(1001).fill(row)));
});
test('CSV escapes quotes, line breaks and spreadsheet formulas',()=>{
 const csv=reportCsv([{name:'=HYPERLINK("x")',kind:'staff',house:'None'},{name:'Line\nbreak'}]);
 assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));assert.ok(csv.includes('"Line\nbreak"'));
});
