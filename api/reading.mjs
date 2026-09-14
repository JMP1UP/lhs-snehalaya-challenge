import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createBook, finishBook, updateBook, restoreBooks } from "../src/lhs365/reading.mjs";
import { buildReport, mergeRoster, validateRoster } from "../src/lhs365/admin.mjs";
import { CAMPAIGN, emailKey, authorisedIdentity, requireAdmin, requireMember } from "../server/reading-policy.mjs";
import { fetchVeracrossRoster } from "../server/veracross.mjs";

function fail(message, status = 400) { const e = new Error(message); e.status = status; throw e; }
function services() {
  if (process.env.READING_LIVE_ENABLED !== "true") fail("School reading is not enabled yet. The fictional preview is still available.", 503);
  const projectId = process.env.READING_FIREBASE_PROJECT_ID;
  const admins = (process.env.READING_ADMIN_EMAILS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!projectId || !admins.length || !process.env.READING_FIREBASE_SERVICE_ACCOUNT) fail("School reading setup is incomplete.", 503);
  const credentials = JSON.parse(process.env.READING_FIREBASE_SERVICE_ACCOUNT);
  if (credentials.project_id !== projectId) fail("School reading setup is incomplete.", 503);
  const app = getApps().find(app => app.name === "reading-server") || initializeApp({credential:cert(credentials),projectId}, "reading-server");
  return { auth:getAuth(app), db:getFirestore(app), admins };
}
function londonDate() { return new Intl.DateTimeFormat("en-CA", {timeZone:"Europe/London",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
const familyCode=()=>randomBytes(5).toString("hex").toUpperCase();
const familyCodeKey=code=>createHash("sha256").update(code).digest("hex");
const cleanFamilyName=value=>{const name=typeof value==="string"?value.trim():"";if(!name||name.length>50)fail("Enter a family member name (up to 50 characters).");return name;};
async function findHousehold(campaign,key){const membership=await campaign.collection("familyMemberships").doc(key).get();if(!membership.exists)return null;const doc=await campaign.collection("households").doc(membership.data().householdId).get();if(!doc.exists)fail("This family link needs administrator attention.",409);return {id:membership.data().householdId,...doc.data()};}
async function householdPayload(campaign,key){const household=await findHousehold(campaign,key);if(!household)return null;const books=await campaign.collection("books").where("householdId","==",household.id).limit(501).get();if(books.size>500)fail("This family bookshelf exceeds the pilot limit.",409);return {id:household.id,name:household.name,joinCode:household.joinCode,readers:household.readers||[],books:books.docs.map(doc=>doc.data())};}
export function createHandler(getServices = services) { return async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); fail("Method not allowed.", 405); }
    const {auth,db,admins,veracrossRoster=fetchVeracrossRoster} = getServices();
    const resource = req.query.resource || "me";
    const campaign = db.collection("readingCampaigns").doc(CAMPAIGN);
    if (req.method === "GET" && resource === "summary") {
      const snapshot = await campaign.collection("books").limit(10001).get();
      if (snapshot.size > 10000) fail("The community total is temporarily unavailable.", 409);
      const {community} = buildReport([],snapshot.docs.map(doc=>doc.data()));
      res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
      return res.status(200).json(community);
    }
    const bearer = req.headers.authorization;
    if (typeof bearer !== "string" || !bearer.startsWith("Bearer ")) fail("Sign in to school reading.", 401);
    let token;
    try { token = await auth.verifyIdToken(bearer.slice(7), true); } catch { fail("Your session has expired. Sign in again.", 401); }
    const identity = authorisedIdentity(token, admins);
    const rosterRef = campaign.collection("settings").doc("roster");
    const rosterDoc = await rosterRef.get();
    const roster = rosterDoc.exists ? rosterDoc.data() : {people:[],complete:false};
    if (req.method === "GET" && resource === "admin") {
      requireAdmin(identity);
      const [snapshot,membersSnapshot] = await Promise.all([
        campaign.collection("books").limit(10001).get(),
        campaign.collection("members").limit(1001).get(),
      ]);
      if (snapshot.size > 10000) fail("This report exceeds the pilot limit. Contact the administrator before exporting.", 409);
      if (membersSnapshot.size > 1000) fail("This sign-in report exceeds the pilot limit. Contact the administrator.",409);
      const rosterKeys=new Set(roster.people.map(person=>person.id));
      const unmatchedLogins=membersSnapshot.docs.map(doc=>doc.data()).filter(member=>member.email&&!rosterKeys.has(member.key)).map(({email,firstSeenAt,lastSeenAt})=>({email,firstSeenAt,lastSeenAt}));
      return res.status(200).json({people:roster.people,complete:roster.complete,version:roster.version || 0,books:snapshot.docs.map(d => d.data()),unmatchedLogins,updatedAt:new Date().toISOString()});
    }
    if (req.method === "GET" && resource === "staff") {
      const person=identity.isAdmin ? null : requireMember(identity,roster.people);
      if(person && person.kind!=="staff")fail("Staff access is required.",403);
      const snapshot=await campaign.collection("books").limit(10001).get();
      if(snapshot.size>10000)fail("This report exceeds the pilot limit.",409);
      const report=buildReport(roster.people,snapshot.docs.map(d=>d.data()));
      return res.status(200).json({formGroup:person?.formGroup||"",complete:roster.complete===true,studentSummary:report.studentSummary,formGroups:report.formGroups,updatedAt:new Date().toISOString()});
    }
    if (req.method === "GET" && resource === "me") {
      const person = roster.people.find(p => p.id === identity.key && p.active !== false) || null;
      const memberRef=campaign.collection("members").doc(identity.key);
      const now=new Date().toISOString();
      await db.runTransaction(async tx=>{
        const current=await tx.get(memberRef),prior=current.data()||{};
        tx.set(memberRef,{...prior,key:identity.key,email:identity.email,firstSeenAt:prior.firstSeenAt||now,lastSeenAt:now});
      });
      const snapshot = await campaign.collection("books").where("ownerKey","==",identity.key).limit(201).get();
      if (snapshot.size > 200) fail("This bookshelf exceeds the pilot limit.",409);
      const family=await householdPayload(campaign,identity.key);
      return res.status(200).json({isAdmin:identity.isAdmin,canViewForms:person?.kind==="staff",person,books:snapshot.docs.map(d => d.data()),family});
    }
    if (req.method !== "POST") fail("Unknown reading resource.",404);
    if (!req.headers["content-type"]?.startsWith("application/json")) fail("Use JSON for this request.",415);
    if (JSON.stringify(req.body || {}).length > 500000) fail("The upload is too large.",413);
    const body = typeof req.body === "object" && req.body ? req.body : {};
    if (body.action === "veracross-preview") {
      requireAdmin(identity);
      const preview=await veracrossRoster();
      return res.status(200).json({...preview,people:validateRoster(preview.people)});
    }
    if (body.action === "family-create") {
      const existingFamily=await householdPayload(campaign,identity.key);if(existingFamily)return res.status(200).json(existingFamily);
      const id=randomUUID(),joinCode=familyCode();
      await db.runTransaction(async tx=>{const codeRef=campaign.collection("familyCodes").doc(familyCodeKey(joinCode)),membershipRef=campaign.collection("familyMemberships").doc(identity.key);const [used,membership]=await Promise.all([tx.get(codeRef),tx.get(membershipRef)]);if(used.exists)fail("Please try creating the family group again.",409);if(membership.exists)return;tx.create(campaign.collection("households").doc(id),{name:"Our family",joinCode,memberKeys:[identity.key],readers:[],createdAt:new Date().toISOString()});tx.create(codeRef,{householdId:id});tx.create(membershipRef,{householdId:id});});
      return res.status(201).json(await householdPayload(campaign,identity.key));
    }
    if (body.action === "family-join") {
      const existingFamily=await householdPayload(campaign,identity.key);if(existingFamily)return res.status(200).json(existingFamily);
      const code=typeof body.code==="string"?body.code.replace(/[^a-f0-9]/gi,"").toUpperCase():"";
      if(!/^[A-F0-9]{10}$/.test(code))fail("Enter the 10-character family code.");
      await db.runTransaction(async tx=>{const membershipRef=campaign.collection("familyMemberships").doc(identity.key),membership=await tx.get(membershipRef);if(membership.exists)return;const linked=await tx.get(campaign.collection("familyCodes").doc(familyCodeKey(code)));if(!linked.exists)fail("That family code was not found.",404);const ref=campaign.collection("households").doc(linked.data().householdId),doc=await tx.get(ref);if(!doc.exists)fail("That family group is unavailable.",404);const members=doc.data().memberKeys||[];if(members.length>=8)fail("This family group already has the maximum number of school accounts.",409);tx.set(ref,{...doc.data(),memberKeys:[...new Set([...members,identity.key])]});tx.create(membershipRef,{householdId:linked.data().householdId});});
      return res.status(200).json(await householdPayload(campaign,identity.key));
    }
    if (body.action === "family-reader") {
      const household=await findHousehold(campaign,identity.key);if(!household)fail("Create or join a family group first.",409);
      const name=cleanFamilyName(body.name),readers=household.readers||[];if(readers.length>=12)fail("A family group can have up to 12 readers.",409);const reader={id:randomUUID(),name};
      await db.runTransaction(async tx=>{const ref=campaign.collection("households").doc(household.id),doc=await tx.get(ref);if(!doc.exists||!doc.data().memberKeys?.includes(identity.key))fail("Family group not found.",404);const latest=doc.data().readers||[];if(latest.length>=12)fail("A family group can have up to 12 readers.",409);tx.set(ref,{...doc.data(),readers:[...latest,reader]});});
      return res.status(201).json(await householdPayload(campaign,identity.key));
    }
    if (body.action === "roster" || body.action === "roster-merge") {
      requireAdmin(identity);
      if (body.action==="roster" && typeof body.complete !== "boolean") fail("Confirm whether the roster is complete.");
      const incoming = validateRoster(body.people).map(person => ({...person,id:emailKey(person.email)}));
      if (!incoming.length) fail("Add at least one person to the roster upload.");
      await db.runTransaction(async tx => {
        const latest = await tx.get(rosterRef);
        const version = latest.data()?.version || 0;
        if (body.version !== version) fail("The roster changed. Refresh before importing again.",409);
        const current=latest.data()?.people||[];
        const people=body.action==="roster-merge"?mergeRoster(current,incoming):incoming;
        const complete=body.action==="roster-merge"?(latest.data()?.complete===true):body.complete;
        tx.set(rosterRef,{people,complete,version:version+1,updatedAt:new Date().toISOString()});
      });
      return res.status(200).json({saved:true});
    }
    if (body.action === "add") {
      if (typeof body.title !== "string" || typeof body.author !== "string" || typeof body.id !== "string" || !/^[a-f0-9-]{36}$/.test(body.id)) fail("Enter valid book details.");
      const base = createBook({title:body.title,author:body.author,total:body.total,start:body.completed === false ? (body.start ?? "0") : "0"}, body.id);
      const book = body.completed === false ? base : finishBook(base,londonDate());
      const bookRef = campaign.collection("books").doc(book.id);
      const memberRef = campaign.collection("members").doc(identity.key);
      let familyOwner=null;
      if(body.familyReaderId!==undefined){if(typeof body.familyReaderId!=="string")fail("Choose a valid family reader.");const household=await findHousehold(campaign,identity.key),reader=household?.readers?.find(item=>item.id===body.familyReaderId);if(!household||!reader)fail("Family reader not found.",404);familyOwner={ownerKey:`family:${household.id}:${reader.id}`,householdId:household.id,familyReaderId:reader.id};}
      const storedBook={...book,ownerKey:familyOwner?.ownerKey||identity.key,...(familyOwner||{})};
      const saved = await db.runTransaction(async tx => {
        const existing = await tx.get(bookRef);
        if (existing.exists) {
          const prior = existing.data();
          if (prior.ownerKey !== (familyOwner?.ownerKey||identity.key) || ["title","author","total","start"].some(key => prior[key] !== book[key])) fail("This book request has changed. Refresh your bookshelf.",409);
          return prior;
        }
        const member = await tx.get(memberRef);
        if ((member.data()?.bookCount || 0) >= 200) fail("The reading pilot supports up to 200 books per person.",409);
        tx.create(bookRef, storedBook);
        const prior=member.data()||{};
        tx.set(memberRef,{...prior,key:identity.key,email:identity.email,bookCount:(prior.bookCount || 0)+1});
        return storedBook;
      });
      return res.status(201).json(saved);
    }
    if (body.action === "progress") {
      if (typeof body.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(body.id)) fail("Invalid book.");
      const ref = campaign.collection("books").doc(body.id);
      const updated = await db.runTransaction(async tx => {
        const doc = await tx.get(ref);
        if (!doc.exists || doc.data().ownerKey !== identity.key) fail("Book not found.",404);
        const book = doc.data(); restoreBooks(JSON.stringify([book]));
        if (String(body.page) === String(book.current)) return book;
        const next = updateBook(book, body.page, londonDate());
        tx.set(ref,next); return next;
      });
      return res.status(200).json(updated);
    }
    fail("Unknown reading action.",400);
  } catch (error) {
    const status = error.status || (error.message?.startsWith("Enter ") || error.message?.startsWith("Check roster") || error.message?.startsWith("Use a roster") ? 400 : 500);
    return res.status(status).json({error:status === 500 ? "Reading could not be loaded or saved. Please try again." : error.message});
  }
}

}
export default createHandler();
