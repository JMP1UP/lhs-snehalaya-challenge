// Challenge estimate, not the measured thickness of a reader's edition.
export const PAGE_HEIGHT_MM = 0.05;
export const landmarks = [
  { id: "door", name: "a doorway", metres: 2, label: "Doorway", note: "Illustrative 2 m doorway" },
  { id: "giraffe", name: "a giraffe", metres: 5, label: "Giraffe", note: "Representative adult height" },
  { id: "big-ben", name: "Big Ben’s tower", metres: 96, label: "Big Ben", note: "Elizabeth Tower, rounded to 96 m" },
];
export function towerProgress(pages, landmark = landmarks[0]) {
  if (!Number.isSafeInteger(pages) || pages < 0) throw new Error("Invalid page total");
  const target = Math.round(landmark.metres * 1000 / PAGE_HEIGHT_MM);
  return { millimetres: pages * PAGE_HEIGHT_MM, target, remaining: Math.max(0, target - pages), percent: Math.min(100, pages / target * 100) };
}
export function formatHeight(mm) {
  if (mm < 10) return `${Number(mm.toFixed(2))} mm`;
  if (mm < 1000) return `${Number((mm / 10).toFixed(1))} cm`;
  return `${Number((mm / 1000).toFixed(2))} m`;
}
