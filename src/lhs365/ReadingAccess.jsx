import ReadingChallenge from "./ReadingChallenge";
import SchoolAccess from "./SchoolAccess";
import { liveReading } from "./reading-client.mjs";
export default function ReadingAccess() {
  if (!liveReading) return <ReadingChallenge />;
  return <SchoolAccess>{({user,me,api}) => <ReadingChallenge key={user.uid} repository={{
    books:[...me.books,...(me.family?.books||[])],
    family:me.family,
    add:(draft,id,familyReaderId) => api.request(user,"me",{action:"add",...draft,id,completed:true,...(familyReaderId?{familyReaderId}:{})}),
    update:(id,page) => api.request(user,"me",{action:"progress",id,page}),
    createFamily:() => api.request(user,"me",{action:"family-create"}),
    joinFamily:code => api.request(user,"me",{action:"family-join",code}),
    addFamilyReader:name => api.request(user,"me",{action:"family-reader",name}),
  }} />}</SchoolAccess>;
}
