const ACTIVE_ENROLMENT_STATUSES = new Set([5, 18]);
const REQUIRED_SCOPES = ["students:list", "students:read", "staff_faculty:list"];

function required(name, environment) {
  const value = environment[name]?.trim();
  if (!value) throw new Error("The Veracross roster connection is not configured.");
  return value;
}

function labels(lists, field) {
  return new Map(
    (lists.find(list => Array.isArray(list.fields) && list.fields.includes(field))?.items || [])
      .map(item => [String(item.id), String(item.description || "").trim()]),
  );
}

function yearGroup(description) {
  const match = /^Year\s+(\d{1,2})$/i.exec(description.trim());
  const year = match ? Number(match[1]) : null;
  return year && year >= 1 && year <= 13 ? `Year ${year}` : /^EYFS$/i.test(description.trim()) ? "EYFS" : "";
}

function formGroup(description) {
  if (!description || description === "<None>") return "";
  return description.split(/[/:]/, 1)[0].trim().slice(0, 40);
}

function schoolEmail(record) {
  return String(record.email_1 || record.email || record.username || "").trim().toLowerCase();
}

function displayName(record) {
  return [record.preferred_name || record.first_name, record.last_name].filter(Boolean).join(" ").trim()
    || String(record.display_name || record.full_name || "").trim();
}

async function endpoint(fetcher, token, base, name, includeLists = false, signal) {
  const records = [];
  let valueLists = [];
  let revision = "";
  for (let page = 1; page <= 100; page += 1) {
    const response = await fetcher(`${base}/${name}`, {signal,headers:{
      authorization:`Bearer ${token}`,
      "x-page-number":String(page),
      "x-page-size":"1000",
      "x-api-value-lists":includeLists && page === 1 ? "include" : "exclude",
    }});
    if (!response.ok) throw new Error(`Veracross ${name} request failed (${response.status}).`);
    revision ||= response.headers.get("x-api-revision") || "";
    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : (payload.data || []);
    if (!Array.isArray(rows)) throw new Error(`Veracross returned an invalid ${name} response.`);
    if (page === 1) valueLists = payload.value_lists || [];
    records.push(...rows);
    if (rows.length < 1000) break;
    if (page === 100) throw new Error("The Veracross roster is larger than the safe import limit.");
  }
  return {records,valueLists,revision};
}

export async function fetchVeracrossRoster({environment=process.env,fetcher=fetch}={}) {
  const clientId=required("VERACROSS_CLIENT_ID",environment);
  const clientSecret=required("VERACROSS_CLIENT_SECRET",environment);
  const route=required("VERACROSS_SCHOOL_ROUTE",environment);
  const scope=(environment.VERACROSS_SCOPES || REQUIRED_SCOPES.join(" ")).trim();
  const authUrl=(environment.VERACROSS_AUTH_URL || `https://accounts.veracross.com/${route}/oauth/token`).trim();
  const base=(environment.VERACROSS_API_BASE_URL || `https://api.veracross.com/${route}/v3`).trim().replace(/\/$/,"");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),15000);
  try {
    const response=await fetcher(authUrl,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"client_credentials",client_id:clientId,client_secret:clientSecret,scope}),signal:controller.signal});
    if(!response.ok)throw new Error(`Veracross authentication failed (${response.status}).`);
    const token=await response.json();
    if(!token.access_token)throw new Error("Veracross did not return an access token.");
    const [students,staff]=await Promise.all([
      endpoint(fetcher,token.access_token,base,"students",true,controller.signal),
      endpoint(fetcher,token.access_token,base,"staff_faculty",false,controller.signal),
    ]);
    const grades=labels(students.valueLists,"grade_level");
    const forms=labels(students.valueLists,"homeroom");
    const houseLabels=labels(students.valueLists,"house_team");
    const people=[];
    let skipped=0;
    for(const student of students.records){
      if(!ACTIVE_ENROLMENT_STATUSES.has(Number(student.enrollment_status))){continue;}
      const email=schoolEmail(student),name=displayName(student),year=yearGroup(grades.get(String(student.grade_level)) || ""),form=formGroup(forms.get(String(student.homeroom)) || "");
      const rawHouse=houseLabels.get(String(student.house_team)) || "None";
      const house=["Beaumanor","Bradgate","Charnwood"].includes(rawHouse) ? rawHouse : "None";
      if(!name||!email.endsWith("@leicesterhigh.co.uk")||!year||!form){skipped+=1;continue;}
      people.push({name,email,kind:"student",house,yearGroup:year,formGroup:form,active:true});
    }
    for(const member of staff.records){
      const email=schoolEmail(member),name=displayName(member);
      if(!name||!email.endsWith("@leicesterhigh.co.uk")){skipped+=1;continue;}
      people.push({name,email,kind:"staff",house:"None",yearGroup:"Staff",formGroup:"",active:true});
    }
    const unique=new Map();
    for(const person of people)unique.set(person.email,person);
    if(!unique.size)throw new Error("Veracross returned no usable school accounts.");
    return {people:[...unique.values()],skipped,sourceRevision:[students.revision,staff.revision].filter(Boolean).join(" / ")};
  } catch(error) {
    if(error?.name === "AbortError")throw new Error("Veracross took too long to respond. Try again.",{cause:error});
    throw error;
  } finally { clearTimeout(timeout); }
}
