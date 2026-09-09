export const STORAGE_KEY = "lhs365:reading-preview:v1";

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function wholeNumber(value, minimum = 0, maximum = 20000) {
  const text = String(value).trim();
  const number = Number(text);
  if (
    !/^\d+$/.test(text) ||
    !Number.isSafeInteger(number) ||
    number < minimum ||
    number > maximum
  ) {
    throw new Error(
      `Enter a whole number from ${minimum.toLocaleString()} to ${maximum.toLocaleString()}.`,
    );
  }
  return number;
}

export function createBook(
  { title, author, total, start = 0 },
  id = crypto.randomUUID(),
) {
  if (!title.trim() || title.trim().length > 200)
    throw new Error("Enter a book title (up to 200 characters).");
  const pages = wholeNumber(total, 1);
  const startingPage = wholeNumber(start, 0, pages);
  return {
    id,
    title: title.trim(),
    author: author.trim().slice(0, 200),
    total: pages,
    start: startingPage,
    current: startingPage,
    logs: [],
  };
}

export function updateBook(book, value, date) {
  if (!validDate(date)) throw new Error("Enter a valid reading date.");
  const current = wholeNumber(value, book.current, book.total);
  if (current === book.current)
    throw new Error(
      "Enter a page beyond your last update. No pages have been added.",
    );
  return {
    ...book,
    current,
    logs: [...book.logs, { pages: current - book.current, date }],
  };
}

export function readingStats(books) {
  return {
    pages: books.reduce((sum, book) => sum + book.current - book.start, 0),
    finished: books.filter(
      (book) => book.current === book.total && book.current > book.start,
    ).length,
    days: new Set(books.flatMap((book) => book.logs.map((log) => log.date)))
      .size,
  };
}

export function restoreBooks(raw) {
  if (!raw) return [];
  const books = JSON.parse(raw);
  if (!Array.isArray(books) || books.length > 200)
    throw new Error("Invalid saved bookshelf.");
  const ids = new Set();
  for (const book of books) {
    if (
      !book ||
      typeof book.id !== "string" ||
      !book.id.trim() ||
      ids.has(book.id) ||
      typeof book.title !== "string" ||
      typeof book.author !== "string" ||
      ![book.total, book.start, book.current].every(Number.isSafeInteger)
    )
      throw new Error("Invalid saved book.");
    ids.add(book.id);
    createBook(book, book.id);
    wholeNumber(book.current, book.start, book.total);
    if (!Array.isArray(book.logs)) throw new Error("Invalid reading history.");
    let sum = 0;
    for (const log of book.logs) {
      if (!log || !Number.isSafeInteger(log.pages)) throw new Error("Invalid reading history.");
      sum += wholeNumber(log.pages, 1);
      if (!validDate(log.date))
        throw new Error("Invalid reading date.");
    }
    if (sum !== book.current - book.start)
      throw new Error("Reading history does not match progress.");
  }
  return books;
}

export function persistBooks(books, storage) {
  if (books.length > 200) throw new Error("This preview supports up to 200 books.");
  const payload = JSON.stringify(books);
  restoreBooks(payload);
  try {
    (storage ?? sessionStorage).setItem(STORAGE_KEY, payload);
  } catch {
    throw new Error("Your browser could not save this update. Please allow session storage and try again.");
  }
}

export function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
