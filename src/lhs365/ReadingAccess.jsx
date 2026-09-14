import { useEffect, useState } from "react";
import ReadingChallenge from "./ReadingChallenge";
import SchoolAccess from "./SchoolAccess";
import { liveReading } from "./reading-client.mjs";
import { advanceCommunity } from "./reading.mjs";
export default function ReadingAccess() {
  const [community,setCommunity]=useState(null);
  useEffect(()=>{
    if(!liveReading)return undefined;
    let active=true;
    fetch("/api/reading?resource=summary",{cache:"no-store",signal:AbortSignal.timeout(10000)})
      .then(response=>response.ok?response.json():Promise.reject())
      .then(summary=>{if(active&&[summary.pages,summary.participants,summary.finished].every(Number.isSafeInteger))setCommunity(summary);})
      .catch(()=>{});
    return()=>{active=false;};
  },[]);
  if (!liveReading) return <ReadingChallenge />;
  return <SchoolAccess>{({user,me,api}) => <ReadingChallenge key={user.uid} community={community} repository={{
    books:[...me.books,...(me.family?.books||[])],
    family:me.family,
    add:async(draft,id,familyReaderId,firstContribution) => {const book=await api.request(user,"me",{action:"add",...draft,id,completed:true,...(familyReaderId?{familyReaderId}:{})});setCommunity(current=>advanceCommunity(current,book,firstContribution));return book;},
    update:(id,page) => api.request(user,"me",{action:"progress",id,page}),
    createFamily:() => api.request(user,"me",{action:"family-create"}),
    joinFamily:code => api.request(user,"me",{action:"family-join",code}),
    addFamilyReader:name => api.request(user,"me",{action:"family-reader",name}),
  }} />}</SchoolAccess>;
}
