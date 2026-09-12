import ReadingChallenge from "./ReadingChallenge";
import SchoolAccess from "./SchoolAccess";
import { liveReading } from "./reading-client.mjs";
export default function ReadingAccess() {
  if (!liveReading) return <ReadingChallenge />;
  return <SchoolAccess>{({user,me,api}) => <ReadingChallenge key={user.uid} repository={{
    books:me.books,
    add:(draft,id) => api.request(user,"me",{action:"add",...draft,id}),
    update:(id,page) => api.request(user,"me",{action:"progress",id,page}),
  }} />}</SchoolAccess>;
}
