import { useEffect, useRef, useState } from "react";
import {
  createBook,
  localDate,
  persistBooks,
  readingStats,
  restoreBooks,
  STORAGE_KEY,
  updateBook,
} from "./reading.mjs";
import BookTower from "./BookTower";
import { searchBooks } from "./catalogue.mjs";

function initialShelf() {
  try {
    return {
      books: restoreBooks(sessionStorage.getItem(STORAGE_KEY)),
      error: "",
    };
  } catch {
    return {
      books: [],
      error:
        "Your preview bookshelf could not be restored. New entries will start a fresh bookshelf.",
    };
  }
}

function BookCard({ book, onUpdate }) {
  const [page, setPage] = useState("");
  const [saving,setSaving] = useState(false);
  const [error, setError] = useState("");
  const finished = book.current === book.total;
  return (
    <article className="reading-book">
      <div className="book-spine" aria-hidden="true">
        {book.title.slice(0, 1)}
      </div>
      <div className="book-detail">
        <span className="eyebrow">
          {finished ? "Finished" : "Currently reading"}
        </span>
        <h3>{book.title}</h3>
        {book.author && <p>{book.author}</p>}
        <progress
          max={book.total}
          value={book.current}
          aria-label={`${book.title} progress`}
        />
        <div className="book-meta">
          <span>
            Page {book.current} of {book.total}
          </span>
          <span>{book.current - book.start} pages contributed</span>
        </div>
        {!finished && (
          <form
            className="progress-form"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                if (saving) return;
                setSaving(true);
                await onUpdate(page);
                setPage("");
                setError("");
              } catch (err) {
                setError(err.message);
              } finally { setSaving(false); }
            }}
          >
            <label htmlFor={`page-${book.id}`}>I’ve reached page</label>
            <div className="input-action">
              <input
                id={`page-${book.id}`}
                disabled={saving}
                type="number"
                min={book.current + 1}
                max={book.total}
                step="1"
                required
                value={page}
                onChange={(event) => setPage(event.target.value)}
                aria-describedby={error ? `error-${book.id}` : undefined}
              />
              <button className="button primary" type="submit" disabled={saving}>
                Save pages
              </button>
            </div>
            {error && (
              <p className="form-error" role="alert" id={`error-${book.id}`}>
                {error}
              </p>
            )}
          </form>
        )}
        {finished && (
          <p className="completion">✓ Finished</p>
        )}
      </div>
    </article>
  );
}

export default function ReadingChallenge({ repository }) {
  const [initial] = useState(() => repository ? {books:repository.books,error:""} : initialShelf());
  const [saving,setSaving] = useState(false);
  const addRequest = useRef(null);
  const [books, setBooks] = useState(initial.books);
  const currentBooks = useRef(initial.books);
  const [notice, setNotice] = useState(initial.error);
  const [adding, setAdding] = useState(initial.books.length === 0);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    author: "",
    total: "",
    start: "0",
  });
  const [error, setError] = useState("");
  const searchId = useRef(0);
  const addButton = useRef(null);
  const stats = readingStats(books);
  const finishedSummary = useRef(null);
  const focusFinished = useRef(false);
  useEffect(() => {
    if (focusFinished.current) {
      finishedSummary.current?.focus();
      focusFinished.current = false;
    }
  }, [books]);

  function save(next, message) {
    if (!repository) persistBooks(next);
    currentBooks.current = next;
    setBooks(next);
    setNotice(message);
  }

  async function search(event) {
    event.preventDefault();
    const currentSearch = ++searchId.current;
    setSearching(true);
    setResults([]);
    setSearchMessage("");
    try {
      const matches = await searchBooks(query);
      if (currentSearch !== searchId.current) return;
      setResults(matches);
      setSearchMessage(
        matches.length
          ? "Choose your book, then check the page count against your copy."
          : "No matches found. Try an ISBN, or add your book manually below.",
      );
    } catch (err) {
      if (currentSearch === searchId.current)
        setSearchMessage(
          err.name === "TimeoutError"
            ? "Book search took too long. Try again or add your book manually."
            : "Book search is unavailable just now. You can still add your book manually below.",
        );
    } finally {
      if (currentSearch === searchId.current) setSearching(false);
    }
  }

  function closeForm() {
    searchId.current += 1;
    setSearching(false);
    setAdding(false);
    setError("");
    addButton.current?.focus();
  }

  return (
    <>
      <section className="reading-heading">
        <div className="eyebrow">LHS 365 · Autumn 2026</div>
        <h1>Read. Stack. <em>Reach higher.</em></h1>
      </section>
      <div className="preview-note">
        {repository ? "Your reading is saved to school. New pages count towards the challenge." : "Preview · Fictional entries only. Saved in this tab; not sent to school."}
      </div>
      <div className="reading-workspace">
      <div className="reading-layout">
        <section>
          <div className="section-heading">
            <div>
              <h2>Log your reading</h2>
            </div>
            <button
              ref={addButton}
              disabled={saving}
              className="button primary add-book-primary"
              onClick={() => {
                setAdding(true);
                setNotice("");
              }}
              aria-expanded={adding}
              aria-controls="add-book"
            >
              + Add a book
            </button>
          </div>
          {notice && (
            <p className="status-message" role="status">
              {notice}
            </p>
          )}
          {adding && (
            <section
              className="add-book"
              id="add-book"
              aria-labelledby="add-book-title"
            >
              <div className="section-heading">
                <h3 id="add-book-title">Add a book</h3>
                <button className="text-link" onClick={closeForm} disabled={saving}>
                  Cancel
                </button>
              </div>
              <fieldset disabled={saving} className="book-entry-fields">
              <legend className="sr-only">Book details</legend>
              <form onSubmit={search}>
                <label htmlFor="book-search">
                  Search by title, author or ISBN
                </label>
                <div className="input-action">
                  <input
                    autoFocus={books.length > 0}
                    id="book-search"
                    value={query}
                    maxLength={200}
                    required
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="e.g. The Jungle Book"
                  />
                  <button
                    className="button secondary"
                    disabled={searching || !query.trim()}
                  >
                    {searching ? "Searching…" : "Find book"}
                  </button>
                </div>
                <small>
                  Search terms go to Google Books and, if unavailable, Open Library. Don’t include personal
                  information.
                </small>
              </form>
              <p role="status" className="search-message">
                {searchMessage}
              </p>
              {results.length > 0 && (
                <ul className="book-results">
                  {results.map((result, index) => (
                    <li key={`${result.id}-${index}`}>
                      <button
                        onClick={() => {
                          setDraft({
                            title: result.title.slice(0, 200),
                            author: (result.authors || [])
                              .join(", ")
                              .slice(0, 200),
                            total:
                              Number.isInteger(result.pageCount) &&
                              result.pageCount > 0 &&
                              result.pageCount <= 20000
                                ? String(result.pageCount)
                                : "",
                            start: "0",
                          });
                          setSearchMessage(
                            result.pageCountEstimated
                              ? "Book selected. This is an estimated page count across editions — check your copy before adding it."
                              : "Book selected. Check the details below before adding it.",
                          );
                          setResults([]);
                        }}
                      >
                        <strong>{result.title}</strong>
                        <span>
                          {(result.authors || []).join(", ") ||
                            "Author unknown"}{" "}
                          · {result.publishedDate || "Date unknown"} ·{" "}
                          {result.pageCount
                            ? `${result.pageCountEstimated ? "Approx. " : ""}${result.pageCount} pages`
                            : "Page count unavailable"}
                        </span>
                        <small>{result.source || result.publisher || "Publisher unknown"}{result.pageCountEstimated ? " · Check your edition’s page count" : ""}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="manual-book"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    if (saving) return;
                    createBook(draft);
                    setSaving(true);
                    const fingerprint = JSON.stringify(draft);
                    if (addRequest.current?.fingerprint !== fingerprint) addRequest.current = {fingerprint,id:crypto.randomUUID()};
                    const book = repository ? await repository.add(draft,addRequest.current.id) : createBook(draft);
                    addRequest.current = null;
                    save(
                      [...currentBooks.current.filter(item => item.id !== book.id), book],
                      `Added ${book.title}. Update your page to start contributing.`,
                    );
                    setDraft({ title: "", author: "", total: "", start: "0" });
                    setQuery("");
                    setResults([]);
                    setSearchMessage("");
                    closeForm();
                  } catch (err) {
                    setError(err.message);
                  } finally { setSaving(false); }
                }}
              >
                <h4>Or add a book yourself</h4>
                <label htmlFor="book-title">
                  Book title
                  <input
                    id="book-title"
                    required
                    maxLength={200}
                    value={draft.title}
                    onChange={(event) =>
                      setDraft({ ...draft, title: event.target.value })
                    }
                  />
                </label>
                <label htmlFor="book-author">
                  Author <span>(optional)</span>
                  <input
                    id="book-author"
                    maxLength={200}
                    value={draft.author}
                    onChange={(event) =>
                      setDraft({ ...draft, author: event.target.value })
                    }
                  />
                </label>
                <div className="form-columns">
                  <label htmlFor="book-total">
                    Total pages
                    <input
                      id="book-total"
                      type="number"
                      required
                      min="1"
                      max="20000"
                      step="1"
                      value={draft.total}
                      onChange={(event) =>
                        setDraft({ ...draft, total: event.target.value })
                      }
                    />
                  </label>
                  <label htmlFor="book-start">
                    Page already reached
                    <input
                      id="book-start"
                      type="number"
                      required
                      min="0"
                      max={draft.total || 20000}
                      step="1"
                      value={draft.start}
                      onChange={(event) =>
                        setDraft({ ...draft, start: event.target.value })
                      }
                    />
                  </label>
                </div>
                <small>
                  Use 0 for a new book. Pages you’ve already read won’t count
                  towards this challenge. For ebooks, use a consistent page
                  count from your edition.
                </small>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="button primary" disabled={saving}>{saving ? "Saving…" : "Add to my bookshelf"}</button>
              </form>
              </fieldset>
            </section>
          )}
          {books.length === 0 && !adding && (
            <div className="empty-shelf">
              <span aria-hidden="true">Aa</span>
              <h3>What are you reading?</h3>
              <p>
                Add a book. Tell us the page you’ve reached.
              </p>

            </div>
          )}
          <div className="books-list">
            {books.filter((book) => book.current < book.total).map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onUpdate={async (page) => {
                  const next = repository ? await repository.update(book.id,page) : updateBook(book,page,localDate());
                  const completed = next.current === next.total;
                  save(
                    currentBooks.current.map((item) => (item.id === next.id ? next : item)),
                    completed
                      ? `${next.current - book.current} pages added. Finished ${next.title}.`
                      : `${next.current - book.current} pages added.`,
                  );
                  if (completed) focusFinished.current = true;
                }}
              />
            ))}
          </div>
          {books.some((book) => book.current === book.total) && (
            <details className="finished-books">
              <summary ref={finishedSummary}>Finished books ({books.filter((book) => book.current === book.total).length})</summary>
              {books.filter((book) => book.current === book.total).map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </details>
          )}
        </section>
      </div>
        <div className="reading-mission-column">
      <BookTower pages={stats.pages} books={books} preview={!repository} />
      <section className="reading-stats" aria-label="Your reading progress">
        {[
          ["Your pages", stats.pages],
          ["Books", stats.finished],
          ["Days logged", stats.days],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value.toLocaleString()}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
        </div>
      </div>
    </>
  );
}
