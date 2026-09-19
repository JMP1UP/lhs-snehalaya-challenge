import { useEffect, useRef, useState } from "react";
import ReadingChallenge from "./ReadingChallenge";
import SchoolAccess from "./SchoolAccess";
import { liveReading } from "./reading-client.mjs";
import { advanceCommunity } from "./reading.mjs";
export default function ReadingAccess() {
  const [community,setCommunity]=useState(null);
  const bookSnapshots=useRef(new Map());
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
    add:async(draft,id,familyReaderId,firstContribution) => {const book=await api.request(user,"me",{action:"add",...draft,id,...(familyReaderId?{familyReaderId}:{})});bookSnapshots.current.set(id,book);setCommunity(current=>advanceCommunity(current,book,firstContribution));return book;},
    update:async(id,page,estimated=false) => {const prior=bookSnapshots.current.get(id)||[...me.books,...(me.family?.books||[])].find(book=>book.id===id);const book=await api.request(user,"me",{action:"progress",id,page,estimated});if(prior)setCommunity(current=>current?{...current,pages:current.pages+book.current-prior.current,finished:current.finished+(book.current===book.total&&prior.current<prior.total?1:0)}:current);bookSnapshots.current.set(id,book);return book;},
    remove:async(id,lastContribution=false) => {const book=await api.request(user,"me",{action:"remove",id});bookSnapshots.current.delete(id);setCommunity(current=>current?{pages:Math.max(0,current.pages-(book.current-book.start)),participants:Math.max(0,current.participants-(lastContribution?1:0)),finished:Math.max(0,current.finished-(book.current===book.total?1:0))}:current);return book;},
    createFamily:() => api.request(user,"me",{action:"family-create"}),
    joinFamily:code => api.request(user,"me",{action:"family-join",code}),
    addFamilyReader:name => api.request(user,"me",{action:"family-reader",name}),
  }} />}</SchoolAccess>;
}
