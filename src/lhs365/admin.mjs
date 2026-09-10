import { readingStats, restoreBooks } from "./reading.mjs";
export const HOUSE_NAMES = ["Beaumanor", "Bradgate", "Charnwood"];
export function validateRoster(rows) {
  if (!Array.isArray(rows) || rows.length > 1000) throw new Error("Use a roster of up to 1,000 people.");
  const seen = new Set();
  return rows.map((row, index) => {
    const fail = () => { throw new Error(`Check roster row ${index + 1}: name, school email, student/staff, house and student year group are required.`); };
    if (!row || typeof row.email !== "string" || typeof row.name !== "string") fail();
    const email = row.email.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@leicesterhigh\.co\.uk$/.test(email) || email.length > 254 || seen.has(email)) fail();
    if (!["student", "staff"].includes(row.kind) || !row.name.trim() || row.name.length > 100) fail();
    const house = row.house || "None";
    if (!(HOUSE_NAMES.includes(house) || (row.kind === "staff" && house === "None"))) fail();
    if (row.kind === "student" && (typeof row.yearGroup !== "string" || !/^(EYFS|Year (?:[1-9]|1[0-3]))$/.test(row.yearGroup))) fail();
    if (row.active !== undefined && typeof row.active !== "boolean") fail();
    seen.add(email);
    return { email, name: row.name.trim(), kind: row.kind, house, yearGroup: row.kind === "staff" ? "Staff" : row.yearGroup, active: row.active !== false };
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
  const all = roster.filter(person => person.active !== false).map(person => ({ ...person, ...readingStats(byPerson.get(person.id) || []) }));
  const people = all.filter(person => (!filters.kind || person.kind === filters.kind) && (!filters.house || person.house === filters.house) && (!filters.yearGroup || person.yearGroup === filters.yearGroup));
  const participants = people.filter(person => person.pages > 0);
  const ranked = participants.slice().sort(order);
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
    unmatchedBooks: books.filter(book => !known.has(book.ownerKey)).length,
  };
}
export function reportCsv(rows) {
  const cell = value => `"${String(value ?? "").replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
  return [["Name", "Role", "House", "Year group", "Pages", "Books finished", "Days logged"], ...rows.map(row => [row.name,row.kind,row.house,row.yearGroup,row.pages,row.finished,row.days])].map(row => row.map(cell).join(",")).join("\r\n");
}
