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
 const db={collection:name=>ref(name),runTransaction:async fn=>{const writes=[];const result=await fn({get:r=>r.get(),set:(r,v)=>writes.push([r.path,v]),create:(r,v)=>{assert.ok(!records.has(r.path));writes.push([r.path,v]);}});for(const [key,value]of writes)records.set(key,structuredClone(value));return result;}};
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
test('Veracross roster preview is admin-only and does not write the roster',async()=>{
 const preview={people:[{...person,id:undefined}],skipped:2,sourceRevision:'r1'};
 assert.equal((await fixture({veracrossRoster:async()=>preview}).call({action:'veracross-preview'},'admin')).code,403);
 const f=fixture({admin:true,veracrossRoster:async()=>preview});
 const result=await f.call({action:'veracross-preview'},'admin');
 assert.equal(result.code,200);assert.equal(result.data.people.length,1);assert.equal(result.data.skipped,2);
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
});
