import test from "node:test";
import assert from "node:assert/strict";
import {fetchVeracrossRoster} from "./veracross.mjs";

const environment={VERACROSS_CLIENT_ID:"client",VERACROSS_CLIENT_SECRET:"secret",VERACROSS_SCHOOL_ROUTE:"lhs"};
const response=(body,headers={})=>({ok:true,status:200,headers:{get:key=>headers[key.toLowerCase()]||null},json:async()=>body});

test("Veracross roster trusts the current-students endpoint and preserves complete form labels",async()=>{
 const calls=[];
 const fetcher=async(url,options={})=>{calls.push({url,options});if(url.includes("oauth/token"))return response({access_token:"token"});if(url.endsWith("/students"))return response({data:[{id:1,preferred_name:"Alex",last_name:"Example",email_1:"alex@leicesterhigh.co.uk",enrollment_status:5,grade_level:8,homeroom:81,house_team:3},{id:2,first_name:"Current",last_name:"Pupil",email_1:"current@leicesterhigh.co.uk",enrollment_status:9,grade_level:8,homeroom:81},{id:3,first_name:"No",last_name:"Tutor",email_1:"no.tutor@leicesterhigh.co.uk",grade_level:8}],value_lists:[{fields:["grade_level"],items:[{id:8,description:"Year 8"}]},{fields:["homeroom"],items:[{id:81,description:"8A / Tutor"}]},{fields:["house_team"],items:[{id:3,description:"Bradgate"}]}]}, {"x-api-revision":"students-r1"});return response([{id:9,preferred_name:"Sam",last_name:"Teacher",email_1:"sam@leicesterhigh.co.uk"}],{"x-api-revision":"staff-r1"});};
 const result=await fetchVeracrossRoster({environment,fetcher});
 assert.deepEqual(result.people,[{name:"Alex Example",email:"alex@leicesterhigh.co.uk",kind:"student",house:"Bradgate",yearGroup:"Year 8",formGroup:"8A / Tutor",active:true},{name:"Current Pupil",email:"current@leicesterhigh.co.uk",kind:"student",house:"None",yearGroup:"Year 8",formGroup:"8A / Tutor",active:true},{name:"No Tutor",email:"no.tutor@leicesterhigh.co.uk",kind:"student",house:"None",yearGroup:"Year 8",formGroup:"Unassigned",active:true},{name:"Sam Teacher",email:"sam@leicesterhigh.co.uk",kind:"staff",house:"None",yearGroup:"Staff",formGroup:"",active:true}]);
 assert.equal(result.sourceRevision,"students-r1 / staff-r1");assert.equal(result.skipped,0);assert.deepEqual(result.skippedPupils,[]);
 assert.equal(String(calls[0].options.body).includes("secret"),true);
 assert.equal(calls.slice(1).every(call=>call.options.headers.authorization==="Bearer token"),true);
});

test("Veracross roster fails closed on missing configuration and unusable pupils",async()=>{
 await assert.rejects(fetchVeracrossRoster({environment:{},fetcher:fetch}),/not configured/);
 const fetcher=async url=>url.includes("oauth/token")?response({access_token:"token"}):url.endsWith("/students")?response({data:[{id:1,first_name:"No",last_name:"Email",grade_level:8},{id:2,first_name:"No",last_name:"Year",email_1:"no.year@leicesterhigh.co.uk"}],value_lists:[{fields:["grade_level"],items:[{id:8,description:"Year 8"}]}]}):response([{preferred_name:"Valid",last_name:"Teacher",email_1:"valid@leicesterhigh.co.uk"}]);
 const result=await fetchVeracrossRoster({environment,fetcher});
 assert.equal(result.skipped,2);
 assert.deepEqual(result.skippedPupils,[{name:"No Email",missing:["school email"]},{name:"No Year",missing:["year group"]}]);
});
