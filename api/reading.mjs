import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { createBook, updateBook, restoreBooks } from "../src/lhs365/reading.mjs";
import { buildReport, mergeRoster, validateRoster } from "../src/lhs365/admin.mjs";
import { CAMPAIGN, emailKey, authorisedIdentity, requireAdmin, requireMember } from "../server/reading-policy.mjs";

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
export function createHandler(getServices = services) { return async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); fail("Method not allowed.", 405); }
    const {auth,db,admins} = getServices();
    const bearer = req.headers.authorization;
    if (typeof bearer !== "string" || !bearer.startsWith("Bearer ")) fail("Sign in to school reading.", 401);
    let token;
    try { token = await auth.verifyIdToken(bearer.slice(7), true); } catch { fail("Your session has expired. Sign in again.", 401); }
    const identity = authorisedIdentity(token, admins);
    const campaign = db.collection("readingCampaigns").doc(CAMPAIGN);
    const rosterRef = campaign.collection("settings").doc("roster");
    const rosterDoc = await rosterRef.get();
    const roster = rosterDoc.exists ? rosterDoc.data() : {people:[],complete:false};
    const resource = req.query.resource || "me";
    if (req.method === "GET" && resource === "admin") {
      requireAdmin(identity);
      const snapshot = await campaign.collection("books").limit(10001).get();
      if (snapshot.size > 10000) fail("This report exceeds the pilot limit. Contact the administrator before exporting.", 409);
      return res.status(200).json({people:roster.people,complete:roster.complete,version:roster.version || 0,books:snapshot.docs.map(d => d.data()),updatedAt:new Date().toISOString()});
    }
    if (req.method === "GET" && resource === "staff") {
      const person=requireMember(identity,roster.people);
      if(person.kind!=="staff")fail("Staff access is required.",403);
      const snapshot=await campaign.collection("books").limit(10001).get();
      if(snapshot.size>10000)fail("This report exceeds the pilot limit.",409);
      const report=buildReport(roster.people,snapshot.docs.map(d=>d.data()));
      return res.status(200).json({formGroup:person.formGroup||"",complete:roster.complete===true,studentSummary:report.studentSummary,formGroups:report.formGroups,updatedAt:new Date().toISOString()});
    }
    if (req.method === "GET" && resource === "me") {
      const person = roster.people.find(p => p.id === identity.key && p.active !== false) || null;
      const snapshot = person ? await campaign.collection("books").where("ownerKey","==",identity.key).limit(201).get() : null;
      if (snapshot?.size > 200) fail("This bookshelf exceeds the pilot limit.",409);
      return res.status(200).json({isAdmin:identity.isAdmin,canViewForms:person?.kind==="staff",person,books:snapshot?.docs.map(d => d.data()) || []});
    }
    if (req.method !== "POST") fail("Unknown reading resource.",404);
    if (!req.headers["content-type"]?.startsWith("application/json")) fail("Use JSON for this request.",415);
    if (JSON.stringify(req.body || {}).length > 500000) fail("The upload is too large.",413);
    const body = typeof req.body === "object" && req.body ? req.body : {};
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
    requireMember(identity, roster.people);
    if (body.action === "add") {
      if (typeof body.title !== "string" || typeof body.author !== "string" || typeof body.id !== "string" || !/^[a-f0-9-]{36}$/.test(body.id)) fail("Enter valid book details.");
      const book = createBook({title:body.title,author:body.author,total:body.total,start:body.start ?? "0"}, body.id);
      const bookRef = campaign.collection("books").doc(book.id);
      const memberRef = campaign.collection("members").doc(identity.key);
      const saved = await db.runTransaction(async tx => {
        requireMember(identity, (await tx.get(rosterRef)).data()?.people || []);
        const existing = await tx.get(bookRef);
        if (existing.exists) {
          const prior = existing.data();
          if (prior.ownerKey !== identity.key || ["title","author","total","start"].some(key => prior[key] !== book[key])) fail("This book request has changed. Refresh your bookshelf.",409);
          return prior;
        }
        const member = await tx.get(memberRef);
        if ((member.data()?.bookCount || 0) >= 200) fail("The reading pilot supports up to 200 books per person.",409);
        tx.create(bookRef, {...book,ownerKey:identity.key});
        tx.set(memberRef,{bookCount:(member.data()?.bookCount || 0)+1});
        return book;
      });
      return res.status(201).json(saved);
    }
    if (body.action === "progress") {
      if (typeof body.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(body.id)) fail("Invalid book.");
      const ref = campaign.collection("books").doc(body.id);
      const updated = await db.runTransaction(async tx => {
        requireMember(identity, (await tx.get(rosterRef)).data()?.people || []);
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
