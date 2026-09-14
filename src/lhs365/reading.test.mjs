import { test } from "node:test";
import assert from "node:assert/strict";
import {
  advanceCommunity,
  createBook,
  persistBooks,
  STORAGE_KEY,
  readingStats,
  restoreBooks,
  updateBook,
  wholeNumber,
} from "./reading.mjs";

const newBook = (overrides = {}) =>
  createBook(
    {
      title: "A fictional adventure",
      author: "Example author",
      total: 120,
      start: 42,
      ...overrides,
    },
    "test-book",
  );

test("joining midway counts only pages read during this challenge", () => {
  const book = updateBook(newBook(), 68, "2026-09-09");
  assert.deepEqual(readingStats([book]), { pages: 26, finished: 0, days: 1 });
});

test("finishing counts remaining pages once and rejects a repeated submission", () => {
  const book = updateBook(
    updateBook(newBook(), 68, "2026-09-09"),
    120,
    "2026-09-10",
  );
  assert.deepEqual(readingStats([book]), { pages: 78, finished: 1, days: 2 });
  assert.throws(() => updateBook(book, 120, "2026-09-10"));
});

test("a new reader updates the live community snapshot immediately", () => {
  const book=updateBook(createBook({title:"Finished",author:"",total:240,start:0},"community-book"),240,"2026-09-14");
  assert.deepEqual(advanceCommunity({pages:1000,participants:4,finished:3},book,true),{pages:1240,participants:5,finished:4});
  assert.deepEqual(advanceCommunity({pages:1000,participants:4,finished:3},book,false),{pages:1240,participants:4,finished:4});
  assert.equal(advanceCommunity(null,book,true),null);
});

test("multiple books on the same date count as one reading day", () => {
  const first = updateBook(newBook(), 50, "2026-09-09");
  const second = updateBook(newBook({ start: 0 }), 10, "2026-09-09");
  assert.equal(readingStats([first, second]).days, 1);
});

test("already finished books count as registered titles but do not earn page credit", () => {
  assert.deepEqual(readingStats([newBook({ start: 120 })]), {
    pages: 0,
    finished: 1,
    days: 0,
  });
});

test("rejects empty, fractional, negative, exponential, out-of-range and non-numeric page values", () => {
  for (const value of ["", " ", -1, 1.5, "1e2", "abc", Infinity, 20001])
    assert.throws(() => wholeNumber(value));
  assert.throws(() => newBook({ total: 0 }));
  assert.throws(() => newBook({ start: 121 }));
  assert.throws(() => newBook({ title: "  " }));
  assert.throws(() => updateBook(newBook(), 41, "2026-09-09"));
  assert.throws(() => updateBook(newBook(), 121, "2026-09-09"));
});

test("session records round-trip and reject corruption or contradictory totals", () => {
  const book = updateBook(newBook(), 68, "2026-09-09");
  assert.deepEqual(restoreBooks(JSON.stringify([book])), [book]);
  assert.deepEqual(restoreBooks(null), []);
  assert.throws(() => restoreBooks("{broken"));
  assert.throws(() => restoreBooks("{}"));
  assert.throws(() => restoreBooks(JSON.stringify([{ ...book, current: 90 }])));
  assert.throws(() => restoreBooks(JSON.stringify([book, book])));
});

test("restored numeric fields cannot change completion semantics through string coercion", () => {
  const book = updateBook(newBook(), 120, "2026-09-09");
  assert.throws(() => restoreBooks(JSON.stringify([{ ...book, current: "120" }])));
});

test("restoration rejects impossible calendar dates and blank identifiers", () => {
  const book = updateBook(newBook(), 68, "2026-09-09");
  assert.throws(() => restoreBooks(JSON.stringify([{ ...book, id: "" }])));
  assert.throws(() => restoreBooks(JSON.stringify([{ ...book, logs: [{pages: 26, date: "2026-02-30"}] }])));
});

test("valid leap days restore, invalid leap days and missing log data do not", () => {
  const book = updateBook(newBook(), 68, "2024-02-29");
  assert.deepEqual(restoreBooks(JSON.stringify([book])), [book]);
  assert.throws(() => updateBook(newBook(), 68, "2026-02-29"));
  assert.throws(() => restoreBooks(JSON.stringify([{ ...book, logs: [null] }])));
  assert.throws(() => restoreBooks(JSON.stringify([{ ...book, logs: [{pages: "26", date: "2024-02-29"}] }])));
});

test("session save failures leave the last saved progress intact", () => {
  const original = newBook();
  let stored = JSON.stringify([original]);
  const storage = { setItem() { throw new DOMException("Quota exceeded", "QuotaExceededError"); } };
  assert.throws(() => persistBooks([updateBook(original, 68, "2026-09-09")], storage), /could not save/);
  assert.equal(restoreBooks(stored)[0].current, 42);
  persistBooks([updateBook(original, 68, "2026-09-09")], { setItem(key, value) { assert.equal(key, STORAGE_KEY); stored = value; } });
  assert.equal(restoreBooks(stored)[0].current, 68);
});

test("oversized shelves are rejected before writing storage", () => {
  const books = Array.from({length:201}, (_, index) => ({...newBook(), id: String(index)}));
  assert.throws(() => persistBooks(books, {setItem() {assert.fail("must not write");}}), /200 books/);
});
