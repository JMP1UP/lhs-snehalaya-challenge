import { HOUSE_NAMES } from "./admin.mjs";
export function adminDemo() {
  const people = Array.from({ length: 40 }, (_, i) => ({ id: `demo-${i}`, name: `${i < 28 ? "Student" : "Staff"} ${String(i + 1).padStart(2, "0")}`, kind: i < 28 ? "student" : "staff", house: HOUSE_NAMES[i % 3], yearGroup: i < 28 ? `Year ${8 + i % 6}` : "Staff", active: true }));
  const books = people.filter((_, i) => i % 5 !== 0).map((person, i) => {
    const pages = (i % 12 + 1) * 25;
    return { id: `sample-book-${i}`, ownerKey: person.id, title: "Fictional sample book", author: "Example author", total: i % 3 === 0 ? pages : pages + 100, start: 0, current: pages, logs: [{pages, date:"2026-09-09"}] };
  });
  return {people, books, complete:true, updatedAt:"Fictional demonstration"};
}
