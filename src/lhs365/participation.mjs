import { readingStats } from "./reading.mjs";

const schoolEmail = /^[a-z0-9._%+-]+@leicesterhigh\.co\.uk$/i;
const clean = value => String(value ?? "").trim();

function delimitedRows(text, delimiter) {
  const rows=[]; let row=[],cell="",quoted=false;
  for(let index=0;index<text.length;index+=1){
    const character=text[index];
    if(character==='"'){
      if(quoted && text[index+1]==='"'){cell+='"';index+=1;}else quoted=!quoted;
    }else if(character===delimiter && !quoted){row.push(cell);cell="";}
    else if((character==='\n' || character==='\r') && !quoted){
      if(character==='\r' && text[index+1]==='\n')index+=1;
      row.push(cell);if(row.some(value=>clean(value)))rows.push(row);row=[];cell="";
    }else cell+=character;
  }
  row.push(cell);if(row.some(value=>clean(value)))rows.push(row);
  return rows;
}

function normaliseEntry(value,index) {
  const item=typeof value==="string" ? (value.includes("@") ? {email:value} : {name:value}) : value;
  if(!item || typeof item!=="object")throw new Error(`Check row ${index+1}: use a name, a school email, or both.`);
  const name=clean(item.name ?? item.fullName ?? item["full name"]);
  const email=clean(item.email ?? item["email address"] ?? item["school email"]).toLowerCase();
  if(!name && !email)throw new Error(`Check row ${index+1}: use a name, a school email, or both.`);
  if(email && (!schoolEmail.test(email) || email.length>254))throw new Error(`Check row ${index+1}: use a Leicester High school email.`);
  return {name,email};
}

export function parseParticipationList(text) {
  const source=clean(text);
  if(!source)throw new Error("Paste a list or choose a file first.");
  let values;
  if(source.startsWith("[")){
    try{values=JSON.parse(source);}catch{throw new Error("That JSON could not be read. Check the commas and quotation marks.");}
    if(!Array.isArray(values))throw new Error("Use a JSON array of people.");
  }else{
    const delimiter=source.includes("\t") ? "\t" : source.includes(",") ? "," : ";";
    const rows=delimitedRows(source,delimiter);
    const header=rows[0]?.map(value=>clean(value).toLowerCase()) ?? [];
    const nameIndex=header.findIndex(value=>["name","full name","student","pupil"].includes(value));
    const emailIndex=header.findIndex(value=>["email","email address","school email"].includes(value));
    const hasHeader=nameIndex>=0 || emailIndex>=0;
    values=(hasHeader ? rows.slice(1) : rows).map(row=>({name:row[nameIndex>=0?nameIndex:0],email:row[emailIndex>=0?emailIndex:1]}));
  }
  if(!values.length || values.length>1000)throw new Error("Use a list of between 1 and 1,000 people.");
  const seen=new Set();
  return values.map(normaliseEntry).filter(item=>{const key=item.email || item.name.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});
}

export function checkParticipation(entries,roster,books) {
  const byEmail=new Map(roster.filter(person=>person.email).map(person=>[person.email.toLowerCase(),person]));
  const byName=new Map();
  for(const person of roster){const key=person.name.toLowerCase();byName.set(key,[...(byName.get(key)||[]),person]);}
  const byOwner=new Map();
  for(const book of books){byOwner.set(book.ownerKey,[...(byOwner.get(book.ownerKey)||[]),book]);}
  return entries.map(entry=>{
    const named=entry.name ? byName.get(entry.name.toLowerCase())||[] : [];
    const person=(entry.email && byEmail.get(entry.email)) || (named.length===1 ? named[0] : null);
    if(!person)return {...entry,matchedName:"",pages:0,state:"unmatched"};
    const stats=readingStats(byOwner.get(person.id)||[]);
    return {...entry,matchedName:person.name,pages:stats.pages,state:stats.pages>0?"participated":"not-started"};
  });
}
