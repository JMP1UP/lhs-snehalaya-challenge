import test from 'node:test';
import assert from 'node:assert/strict';
import {authorisedIdentity,emailKey,requireMember} from './reading-policy.mjs';
import {createHandler} from '../api/reading.mjs';
const email='fictional@leicesterhigh.co.uk';
const token={uid:'uid',email,email_verified:true,firebase:{sign_in_provider:'microsoft.com'}};
const person={id:emailKey(email),email,name:'Fictional',kind:'student',house:'Bradgate',yearGroup:'Year 8',formGroup:'8A',active:true};
function fixture({admin=false,identity=token,revoked=false,rosterPerson=person,veracrossRoster,storedRecords}={}) {
 const records=storedRecords||new Map([['readingCampaigns/read-for-snehalaya-2026/settings/roster',{people:[rosterPerson],complete:true,version:1}]]);
 let bookReads=0;
 const ref=path=>({path,collection:name=>ref(`${path}/${name}`),doc:name=>ref(`${path}/${name}`),get:async()=>({exists:records.has(path),data:()=>structuredClone(records.get(path))}),limit:()=>query(path),where:(field,op,value)=>query(path,field,op,value)});
 const query=(path,field,op,value)=>({limit(){return this;},async get(){bookReads++;const docs=[...records].filter(([key,data])=>key.startsWith(path+'/') && (!field || (op==='array-contains'?data[field]?.includes(value):data[field]===value))).map(([key,data])=>({id:key.split('/').at(-1),data:()=>structuredClone(data)}));return {docs,size:docs.length};}});
 const db={collection:name=>ref(name),runTransaction:async fn=>{const writes=[],deletes=[];const result=await fn({get:r=>r.get(),set:(r,v)=>writes.push([r.path,v]),create:(r,v)=>{assert.ok(!records.has(r.path));writes.push([r.path,v]);},delete:r=>deletes.push(r.path)});for(const key of deletes)records.delete(key);for(const [key,value]of writes)records.set(key,structuredClone(value));return result;}};
 const handler=createHandler(()=>({db,admins:admin?[identity.email.toLowerCase()]:[],veracrossRoster,auth:{verifyIdToken:async(raw,check)=>{assert.equal(check,true);if(revoked)throw new Error('revoked');return identity;}}}));
 async function call(body,resource='me',headers={authorization:'Bearer fixture','content-type':'application/json'}){const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(data){this.data=data;return this;}};await handler({method:body?'POST':'GET',headers,query:{resource},body},res);return res;}
 return {call,records,reads:()=>bookReads};
}
test('identity requires school Microsoft login, never display names',()=>{
 for(const patch of [{email:'a@example.com'},{firebase:{sign_in_provider:'password'}},{uid:''}])assert.throws(()=>authorisedIdentity({...token,...patch},[email]),{status:403});
 assert.equal(authorisedIdentity({...token,email_verified:false},[]).email,email);
 assert.equal(authorisedIdentity({...token,name:'Admin (staff)'},[]).isAdmin,false);
 assert.equal(authorisedIdentity(token,[email]).isAdmin,true);
 assert.throws(()=>requireMember(authorisedIdentity(token,[]),[{...person,active:false}]),{status:403});
});
test('API defaults closed before touching credentials',async()=>{
 const prior=process.env.READING_LIVE_ENABLED;delete process.env.READING_LIVE_ENABLED;
 try {const res={setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;}};await createHandler()({method:'GET',headers:{},query:{}},res);assert.equal(res.code,503);}finally{if(prior!==undefined)process.env.READING_LIVE_ENABLED=prior;}
});
test('missing/revoked sessions and non-admin reports rejected without reading books',async()=>{
 const f=fixture();assert.equal((await f.call(null,'admin',{})).code,401);
 assert.equal((await f.call(null,'admin')).code,403);assert.equal(f.reads(),0);
 assert.equal((await fixture({revoked:true}).call()).code,401);
});
test('admin report includes roster version; roster replacement checks optimistic version and validation',async()=>{
 const f=fixture({admin:true});const report=await f.call(null,'admin');assert.equal(report.code,200);assert.equal(report.data.version,1);assert.equal(report.headers['Cache-Control'],'no-store, private');
 assert.equal((await f.call({action:'roster',people:[person],complete:true,version:0})).code,409);
 assert.equal((await f.call({action:'roster',people:[],complete:true,version:1})).code,400);
 assert.equal((await f.call({action:'roster',people:[person],complete:true,version:1})).code,200);
 assert.equal((await f.call(null,'admin')).data.version,2);
 assert.equal((await fixture().call({action:'roster',people:[person],complete:true,version:1})).code,403);
});
test('public summary exposes only cached whole-school aggregates',async()=>{
 const f=fixture();
 const draft={action:'add',completed:false,id:'cccccccc-cccc-cccc-cccc-cccccccccccc',title:'Public total',author:'',total:100,start:10};
 await f.call(draft);await f.call({action:'progress',id:draft.id,page:35});
 const summary=await f.call(null,'summary',{});
 assert.equal(summary.code,200);
 assert.deepEqual(summary.data,{pages:25,participants:1,finished:0});
 assert.equal(summary.headers['Cache-Control'],'public, s-maxage=60, stale-while-revalidate=300');
});
test('roster merge adds joiners without removing existing people',async()=>{
 const f=fixture({admin:true});
 const newcomer={email:'new@leicesterhigh.co.uk',name:'New Joiner',kind:'student',house:'Charnwood',yearGroup:'Year 9',formGroup:'9B'};
 assert.equal((await f.call({action:'roster-merge',people:[newcomer],version:1})).code,200);
 const later={email:'later@leicesterhigh.co.uk',name:'Later Joiner',kind:'student',house:'Beaumanor',yearGroup:'Year 10',formGroup:'10A'};
 assert.equal((await f.call({action:'roster-merge',people:[later],version:2})).code,200);
 const report=await f.call(null,'admin');
 assert.equal(report.data.people.length,3);
 assert.ok(report.data.people.some(item=>item.email===email));
 assert.ok(report.data.people.some(item=>item.email===newcomer.email));
 assert.ok(report.data.people.some(item=>item.email===later.email));
});
test('Open Day assignments are returned only to their pupil and survive roster replacement',async()=>{
 const openDay={role:'Subject Helper - English',time:'9:15 am',location:'English corridor',lead:'Ms Example',instructions:'Welcome visitors.'};
 const f=fixture({admin:true,rosterPerson:{...person,openDay}});
 const me=await f.call();assert.deepEqual(me.data.person.openDay,openDay);
 assert.equal((await f.call(null,'summary',{})).data.openDay,undefined);
 assert.equal((await f.call({action:'roster',people:[{...person,name:'Updated'}],complete:true,version:1})).code,200);
 assert.deepEqual((await f.call(null,'admin')).data.people[0].openDay,openDay);
 const staff=await fixture({rosterPerson:{...person,kind:'staff',yearGroup:'Staff',openDay}}).call(null,'staff');
 assert.equal(JSON.stringify(staff.data).includes('Subject Helper'),false);
});
test('Veracross roster preview is admin-only, reports incomplete pupils and does not write the roster',async()=>{
 const preview={people:[{...person,id:undefined}],skipped:2,skippedPupils:[{name:'Incomplete Pupil',missing:['year group']}],sourceRevision:'r1'};
 assert.equal((await fixture({veracrossRoster:async()=>preview}).call({action:'veracross-preview'},'admin')).code,403);
 const f=fixture({admin:true,veracrossRoster:async()=>preview});
 const result=await f.call({action:'veracross-preview'},'admin');
 assert.equal(result.code,200);assert.equal(result.data.people.length,1);assert.equal(result.data.skipped,2);assert.deepEqual(result.data.skippedPupils,preview.skippedPupils);
 assert.equal((await f.call(null,'admin')).data.version,1);
});
test('verified rostered staff can read aggregate form figures but pupils cannot',async()=>{
 const staff={...person,kind:'staff',yearGroup:'Staff',formGroup:'8A'};
 const allowed=await fixture({rosterPerson:staff}).call(null,'staff');
 assert.equal(allowed.code,200);assert.equal(allowed.data.formGroup,'8A');
 assert.equal('people' in allowed.data,false);assert.equal('books' in allowed.data,false);
 assert.equal((await fixture().call(null,'staff')).code,403);
 const adminView=await fixture({admin:true}).call(null,'staff');
 assert.equal(adminView.code,200);assert.equal(adminView.data.formGroup,'');
});
test('adding is idempotent, ignores forged owner/logs; progress ownership, baseline and repeated saves',async()=>{
 const f=fixture();const draft={action:'add',completed:false,id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',title:'Example',author:'',total:100,start:20,ownerKey:'forged',logs:[{pages:9999}]};
 assert.equal((await f.call({...draft,title:{}})).code,400);
 const first=await f.call(draft);assert.equal(first.code,201);assert.equal(first.data.current,20);assert.deepEqual(first.data.logs,[]);
 assert.equal((await f.call(draft)).code,201);assert.equal((await f.call({...draft,title:'Changed'})).code,409);
 assert.equal((await f.call()).data.books.length,1);assert.equal((await f.call()).data.books[0].ownerKey,person.id);
 const progress=await f.call({action:'progress',id:draft.id,page:45});assert.equal(progress.code,200);assert.equal(progress.data.logs[0].pages,25);
 assert.equal((await f.call({action:'progress',id:draft.id,page:45})).data.logs.length,1);
 assert.equal((await f.call({action:'progress',id:draft.id,page:44})).code,400);
 assert.equal((await f.call({action:'progress',id:draft.id,page:101})).code,400);
 const key=[...f.records.keys()].find(k=>k.endsWith(draft.id));f.records.get(key).ownerKey='someone-else';
 assert.equal((await f.call({action:'progress',id:draft.id,page:50})).code,404);
});
test('unrostered school accounts can log, see only their bookshelf and appear for admin reconciliation',async()=>{
 const f=fixture({identity:{...token,email:'unknown@leicesterhigh.co.uk'}});
 assert.equal((await f.call()).data.person,null);assert.deepEqual((await f.call()).data.books,[]);
 const draft={action:'add',id:'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',title:'Outside roster',author:'',total:50,start:0};
 assert.equal((await f.call(draft)).code,201);assert.equal((await f.call()).data.books.length,1);
 const admin=fixture({admin:true,identity:{...token,email:'unknown@leicesterhigh.co.uk'}});await admin.call();
 const report=await admin.call(null,'admin');assert.equal(report.data.unmatchedLogins.length,1);assert.equal(report.data.unmatchedLogins[0].email,'unknown@leicesterhigh.co.uk');
});
test('new books are finished by default and credit the whole book',async()=>{
 const f=fixture();const draft={action:'add',id:'dddddddd-dddd-dddd-dddd-dddddddddddd',title:'Finished by default',author:'Writer',total:321,start:200};
 const added=await f.call(draft);
 assert.equal(added.code,201);assert.equal(added.data.start,0);assert.equal(added.data.current,321);assert.equal(added.data.logs.length,1);assert.equal(added.data.logs[0].pages,321);
 const summary=await f.call(null,'summary',{});
 assert.deepEqual(summary.data,{pages:321,participants:1,finished:1});
});
test('owners can remove books, totals reverse and other accounts cannot remove them',async()=>{
 const f=fixture();const id='22222222-2222-2222-2222-222222222222';await f.call({action:'add',id,title:'Remove me',author:'',total:120});
 const outsider=fixture({identity:{...token,uid:'other',email:'other@leicesterhigh.co.uk'},storedRecords:f.records});assert.equal((await outsider.call({action:'remove',id})).code,404);
 const removed=await f.call({action:'remove',id});assert.equal(removed.code,200);assert.equal(removed.data.title,'Remove me');assert.deepEqual((await f.call(null,'summary',{})).data,{pages:0,participants:0,finished:0});assert.equal((await f.call({action:'remove',id})).code,404);
});
test('partial books credit initial reading and subsequent deltas exactly once',async()=>{
 const f=fixture();const draft={action:'add',id:'ffffffff-ffff-ffff-ffff-ffffffffffff',title:'Still reading',author:'',total:200,completed:false,page:50,estimated:true};
 const added=await f.call(draft);assert.equal(added.code,201);assert.equal(added.data.current,50);assert.equal(added.data.estimated,true);
 assert.equal((await f.call(draft)).data.logs.length,1);
 assert.equal((await f.call({...draft,page:100})).code,409);
 const halfway=await f.call({action:'progress',id:draft.id,page:100,estimated:true});assert.equal(halfway.data.logs[1].pages,50);
 assert.equal((await f.call({action:'progress',id:draft.id,page:100,estimated:true})).data.logs.length,2);
 const finished=await f.call({action:'progress',id:draft.id,page:200});assert.equal(finished.data.estimated,false);assert.equal(finished.data.logs[2].pages,100);
 assert.deepEqual((await f.call(null,'summary',{})).data,{pages:200,participants:1,finished:1});
 assert.equal((await f.call({...draft,id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',page:201})).code,400);
});
test('siblings share one private family bookshelf and can log for the same reader',async()=>{
 const first=fixture();
 const created=await first.call({action:'family-create'});assert.equal(created.code,201);assert.match(created.data.joinCode,/^[A-F0-9]{10}$/);
 const repeated=await first.call({action:'family-create'});assert.equal(repeated.code,200);assert.equal(repeated.data.id,created.data.id);
 const withReader=await first.call({action:'family-reader',name:'Mum'});assert.equal(withReader.code,201);const reader=withReader.data.readers[0];
 const familyBook=await first.call({action:'add',id:'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',title:'Shared story',author:'',total:80,familyReaderId:reader.id});
 assert.equal(familyBook.code,201);assert.equal(familyBook.data.familyReaderId,reader.id);assert.equal(familyBook.data.current,80);
 const siblingIdentity={...token,uid:'sibling',email:'sibling@leicesterhigh.co.uk'};
 const sibling=fixture({identity:siblingIdentity,storedRecords:first.records});
 const joined=await sibling.call({action:'family-join',code:created.data.joinCode});assert.equal(joined.code,200);assert.equal(joined.data.readers[0].name,'Mum');assert.equal(joined.data.books[0].title,'Shared story');
 const shelf=await sibling.call();assert.equal(shelf.data.family.books.length,1);assert.deepEqual(shelf.data.books,[]);
 const partial=await first.call({action:'add',id:'11111111-1111-1111-1111-111111111111',title:'Family in progress',author:'',total:100,completed:false,page:25,estimated:true,familyReaderId:reader.id});assert.equal(partial.code,201);
 assert.equal((await sibling.call({action:'progress',id:partial.data.id,page:50,estimated:true})).data.current,50);
 const outsider=fixture({identity:{...token,uid:'outsider',email:'outsider@leicesterhigh.co.uk'},storedRecords:first.records});assert.equal((await outsider.call({action:'progress',id:partial.data.id,page:100})).code,404);
 assert.equal((await sibling.call({action:'progress',id:partial.data.id,page:100})).data.logs.reduce((sum,log)=>sum+log.pages,0),100);
 assert.equal((await sibling.call({action:'remove',id:partial.data.id})).code,200);assert.equal((await first.call()).data.family.books.some(book=>book.id===partial.data.id),false);
});
