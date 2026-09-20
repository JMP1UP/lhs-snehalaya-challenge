import { readingStats, restoreBooks } from "./reading.mjs";
export const HOUSE_NAMES = ["Beaumanor", "Bradgate", "Charnwood"];
const assignmentValue=(value,max,label)=>{const text=typeof value==="string"?value.trim():"";if(text.length>max)throw new Error(`${label} must be ${max} characters or fewer.`);return text;};
export function validateRoster(rows) {
  if (!Array.isArray(rows) || rows.length > 1000) throw new Error("Use a roster of up to 1,000 people.");
  const seen = new Set();
  return rows.map((row, index) => {
    const fail = () => { throw new Error(`Check roster row ${index + 1}: name, school email, student/staff, house, year group and student form group are required.`); };
    if (!row || typeof row.email !== "string" || typeof row.name !== "string") fail();
    const email = row.email.trim().toLowerCase();
    const staffMarker=/\s*\(staff\)\s*$/i.test(row.name);
    const kind=row.kind || (staffMarker ? "staff" : "student");
    const name=row.name.replace(/\s*\(staff\)\s*$/i,"").trim();
    if (!/^[a-z0-9._%+-]+@leicesterhigh\.co\.uk$/.test(email) || email.length > 254 || seen.has(email)) fail();
    if (!["student", "staff"].includes(kind) || !name || name.length > 100) fail();
    const house = row.house || "None";
    if (!(HOUSE_NAMES.includes(house) || house === "None")) fail();
    if (kind === "student" && (typeof row.yearGroup !== "string" || !/^(EYFS|Year (?:[1-9]|1[0-3]))$/.test(row.yearGroup))) fail();
    const formGroup=typeof row.formGroup==="string" ? row.formGroup.trim() : "";
    if(kind==="student" && (!formGroup || formGroup.length>40))fail();
    if(kind==="staff" && formGroup.length>40)fail();
    if (row.active !== undefined && typeof row.active !== "boolean") fail();
    const assignmentSource=row.openDay&&typeof row.openDay==="object"?row.openDay:null;
    const rawRole=assignmentSource?.role ?? row.openDayRole;
    let openDay;
    if(typeof rawRole==="string"&&/^(?:clear|none)$/i.test(rawRole.trim()))openDay=null;
    else if(typeof rawRole==="string"&&rawRole.trim())openDay={
      role:assignmentValue(rawRole,100,"Open Day role"),
      time:assignmentValue(assignmentSource?.time??row.openDayTime,80,"Open Day time"),
      location:assignmentValue(assignmentSource?.location??row.openDayLocation,120,"Open Day meeting point"),
      lead:assignmentValue(assignmentSource?.lead??row.openDayLead,100,"Open Day staff lead"),
      instructions:assignmentValue(assignmentSource?.instructions??row.openDayInstructions,500,"Open Day instructions"),
    };
    seen.add(email);
    return { email, name, kind, house, yearGroup: kind === "staff" ? "Staff" : row.yearGroup, formGroup, active: row.active !== false, ...(openDay!==undefined?{openDay}:{}) };
  });
}
const clean = value => String(value ?? "").trim();
function delimitedRows(text, delimiter) {
  const rows=[];let row=[],cell="",quoted=false;
  for(let index=0;index<text.length;index+=1){
    const character=text[index];
    if(character==='"'){
      if(quoted&&text[index+1]==='"'){cell+='"';index+=1;}else quoted=!quoted;
    }else if(character===delimiter&&!quoted){row.push(cell);cell="";}
    else if((character==='\n'||character==='\r')&&!quoted){
      if(character==='\r'&&text[index+1]==='\n')index+=1;
      row.push(cell);if(row.some(value=>clean(value)))rows.push(row);row=[];cell="";
    }else cell+=character;
  }
  row.push(cell);if(row.some(value=>clean(value)))rows.push(row);
  return rows;
}
export function parseRosterUpload(text) {
  const source=clean(text);
  if(!source)throw new Error("Paste a roster or choose a file first.");
  let values;
  if(source.startsWith("[")){
    try{values=JSON.parse(source);}catch{throw new Error("That JSON could not be read. Check the commas and quotation marks.");}
  }else{
    const delimiter=source.includes("\t")?"\t":source.includes(",")?",":";";
    const rows=delimitedRows(source,delimiter);
    const headers=(rows.shift()||[]).map(value=>clean(value).toLowerCase());
    const aliases={
      name:["name","full name"],email:["email","email address","school email"],kind:["kind","role","user type"],
      house:["house"],yearGroup:["year group","yeargroup","year"],formGroup:["form group","formgroup","form","tutor group"],active:["active"],
      openDayRole:["open day role","openday role","open day assignment"],openDayTime:["open day time","openday time","time"],
      openDayLocation:["open day meeting point","open day location","meeting point","location"],openDayLead:["open day staff lead","staff lead","lead"],
      openDayInstructions:["open day instructions","instructions","what to do"],
    };
    const column=key=>headers.findIndex(header=>aliases[key].includes(header));
    if(column("name")<0||column("email")<0)throw new Error("Include Name and Email headings in the roster file.");
    values=rows.map(row=>Object.fromEntries(Object.keys(aliases).map(key=>[key,column(key)<0?undefined:row[column(key)]])));
    values=values.map(row=>{
      const active=clean(row.active);
      const parsedActive=active===""?undefined:/^(true|yes|1|active)$/i.test(active)?true:/^(false|no|0|inactive)$/i.test(active)?false:active;
      return {...row,kind:clean(row.kind).toLowerCase()||undefined,active:parsedActive};
    });
  }
  return validateRoster(values);
}
export function mergeRoster(existing,incoming) {
  const updates=new Map(incoming.map(person=>[person.id,person]));
  const merged=existing.map(person=>updates.has(person.id)?{...person,...updates.get(person.id)}:person);
  const known=new Set(existing.map(person=>person.id));
  return [...merged,...incoming.filter(person=>!known.has(person.id))];
}
export function replaceRoster(existing,incoming) {
  const current=new Map(existing.map(person=>[person.id||person.email,person]));
  return incoming.map(person=>{
    const prior=current.get(person.id||person.email);
    return person.openDay===undefined&&prior?.openDay!==undefined?{...person,openDay:prior.openDay}:person;
  });
}
const order = (a, b) => b.pages - a.pages || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
export function buildReport(roster, books, filters = {}) {
  const ids = new Set();
  const byPerson = new Map();
  for (const book of books) {
    restoreBooks(JSON.stringify([book]));
    if (ids.has(book.id)) throw new Error("Duplicate reading record. Refresh the report.");
    ids.add(book.id);
    const list = byPerson.get(book.ownerKey) || [];
    list.push(book); byPerson.set(book.ownerKey, list);
  }
  const known = new Set(roster.map(person => person.id));
  const unmatchedBooks=books.filter(book => !book.householdId && !known.has(book.ownerKey));
  const unmatchedByOwner=new Map();
  for(const book of unmatchedBooks){const list=unmatchedByOwner.get(book.ownerKey)||[];list.push(book);unmatchedByOwner.set(book.ownerKey,list);}
  const unmatchedStats=[...unmatchedByOwner.values()].map(readingStats);
  const community={
    pages:[...byPerson.values()].reduce((sum,ownerBooks)=>sum+readingStats(ownerBooks).pages,0),
    participants:[...byPerson.values()].filter(ownerBooks=>readingStats(ownerBooks).pages>0).length,
    finished:[...byPerson.values()].reduce((sum,ownerBooks)=>sum+readingStats(ownerBooks).finished,0),
  };
  const all = roster.filter(person => person.active !== false).map(person => ({ ...person, ...readingStats(byPerson.get(person.id) || []) }));
  const people = all.filter(person => (!filters.kind || person.kind === filters.kind) && (!filters.house || person.house === filters.house) && (!filters.yearGroup || person.yearGroup === filters.yearGroup));
  const participants = people.filter(person => person.pages > 0);
  const ranked = participants.slice().sort(order);
  const students=all.filter(person=>person.kind==="student");
  const studentPages=students.reduce((sum,person)=>sum+person.pages,0);
  const studentParticipants=students.filter(person=>person.pages>0).length;
  const formNames=[...new Set(students.map(person=>person.formGroup||"Unassigned"))];
  const formGroups=formNames.map(name=>{
    const members=students.filter(person=>(person.formGroup||"Unassigned")===name);
    const pages=members.reduce((sum,person)=>sum+person.pages,0),participating=members.filter(person=>person.pages>0).length;
    return {name,pages,enrolled:members.length,participants:participating,rate:members.length?participating/members.length*100:null,averagePages:members.length?pages/members.length:null};
  }).sort((a,b)=>(b.averagePages||0)-(a.averagePages||0)||(b.rate||0)-(a.rate||0)||a.name.localeCompare(b.name));
  const houses = HOUSE_NAMES.map(name => {
    const members = people.filter(person => person.house === name);
    const contributing = members.filter(person => person.pages > 0);
    return { id: name, name, pages: members.reduce((sum, p) => sum + p.pages, 0), enrolled: members.length, participants: contributing.length, rate: members.length ? contributing.length / members.length * 100 : null };
  }).sort(order);
  return {
    pages: people.reduce((sum, p) => sum + p.pages, 0), finished: people.reduce((sum, p) => sum + p.finished, 0),
    enrolled: people.length, participants: participants.length, rate: people.length ? participants.length / people.length * 100 : null,
    topStudents: ranked.filter(p => p.kind === "student").slice(0, 10), topStaff: ranked.filter(p => p.kind === "staff").slice(0, 10), biggest: ranked[0] || null,
    notStarted: people.filter(p => p.pages === 0).sort((a,b) => a.name.localeCompare(b.name)), houses,
    unmatchedBooks: unmatchedBooks.length,
    unmatchedReaders:unmatchedStats.filter(stats=>stats.pages>0).length,
    community,
    studentSummary:{pages:studentPages,enrolled:students.length,participants:studentParticipants,rate:students.length?studentParticipants/students.length*100:null,averagePages:students.length?studentPages/students.length:null},
    formGroups,
  };
}
export function reportCsv(rows) {
  const cell = value => `"${String(value ?? "").replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
  return [["Name", "Role", "House", "Year group", "Form group", "Pages", "Books finished", "Days logged"], ...rows.map(row => [row.name,row.kind,row.house,row.yearGroup,row.formGroup,row.pages,row.finished,row.days])].map(row => row.map(cell).join(",")).join("\r\n");
}
