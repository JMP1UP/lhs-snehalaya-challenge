import { useRef, useState } from "react";
import {
  createBook,
  localDate,
  persistBooks,
  readingStats,
  restoreBooks,
  STORAGE_KEY,
  updateBook,
} from "./reading.mjs";
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
        <p>{book.author || "Author not added"}</p>
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
            onSubmit={(event) => {
              event.preventDefault();
              try {
                onUpdate(updateBook(book, page, localDate()));
                setPage("");
                setError("");
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <label htmlFor={`page-${book.id}`}>I’ve reached page</label>
            <div className="input-action">
              <input
                id={`page-${book.id}`}
                type="number"
                min={book.current + 1}
                max={book.total}
                step="1"
                required
                value={page}
                onChange={(event) => setPage(event.target.value)}
                aria-describedby={error ? `error-${book.id}` : undefined}
              />
              <button className="button primary" type="submit">
                Save progress
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
          <p className="completion">✓ Book complete. Your next story awaits.</p>
        )}
      </div>
    </article>
  );
}

export default function ReadingChallenge() {
  const [initial] = useState(initialShelf);
  const [books, setBooks] = useState(initial.books);
  const [notice, setNotice] = useState(initial.error);
  const [adding, setAdding] = useState(false);
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

  function save(next, message) {
    persistBooks(next);
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
          ? "Choose your edition, then check its page count against your copy."
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
        <a className="text-link" href="#/">
          ← Back to LHS 365
        </a>
        <div className="eyebrow">Autumn term 2026 · Reading & discovery</div>
        <h1>
          Read for <em>Snehalaya.</em>
        </h1>
        <p>Find a story. Make a little time. See how far it takes you.</p>
      </section>
      <div className="preview-note">
        <strong>You’re trying the reading preview.</strong> Books and progress
        stay in this tab’s browser session. They are not submitted to school or
        added to house totals. Use fictional entries for now.
      </div>
      <section className="reading-stats" aria-label="Your preview progress">
        {[
          ["Pages contributed", stats.pages],
          ["Books finished", stats.finished],
          ["Reading days", stats.days],
        ].map(([label, value]) => (
          <div key={label}>
            <strong>{value.toLocaleString()}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>
      <div className="reading-layout">
        <section>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Your next chapter</span>
              <h2>My bookshelf</h2>
            </div>
            <button
              ref={addButton}
              className="button primary"
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
                <h3 id="add-book-title">Find your next read</h3>
                <button className="text-link" onClick={closeForm}>
                  Cancel
                </button>
              </div>
              <form onSubmit={search}>
                <label htmlFor="book-search">
                  Search by title, author or ISBN
                </label>
                <div className="input-action">
                  <input
                    autoFocus
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
                  Search terms are sent to Google Books. Don’t include personal
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
                            "Book selected. Check the details below before adding it.",
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
                            ? `${result.pageCount} pages`
                            : "Page count unavailable"}
                        </span>
                        <small>{result.publisher || "Publisher unknown"}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <form
                className="manual-book"
                onSubmit={(event) => {
                  event.preventDefault();
                  try {
                    const book = createBook(draft);
                    save(
                      [...books, book],
                      `Added ${book.title}. Update your page to start contributing.`,
                    );
                    setDraft({ title: "", author: "", total: "", start: "0" });
                    setQuery("");
                    setResults([]);
                    setSearchMessage("");
                    closeForm();
                  } catch (err) {
                    setError(err.message);
                  }
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
                <button className="button primary">Add to my bookshelf</button>
              </form>
            </section>
          )}
          {books.length === 0 && !adding && (
            <div className="empty-shelf">
              <span aria-hidden="true">Aa</span>
              <h3>A whole world on your bookshelf.</h3>
              <p>
                Add your first book, then log the page you’ve reached.
                <br />
                Every new page is a little progress.
              </p>
              <button className="text-link" onClick={() => setAdding(true)}>
                Find my first book →
              </button>
            </div>
          )}
          <div className="books-list">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onUpdate={(next) =>
                  save(
                    books.map((item) => (item.id === next.id ? next : item)),
                    `${next.current - book.current} pages added. Nicely done.`,
                  )
                }
              />
            ))}
          </div>
        </section>
        <aside className="reading-aside">
          <section className="milestone-panel">
            <span className="eyebrow">Small steps, lasting habits</span>
            <h2>Your milestones</h2>
            {[
              ["A new chapter", "Log your first pages", stats.pages > 0],
              [
                "Between the covers",
                "Finish your first book",
                stats.finished > 0,
              ],
              ["Making time", "Read on 3 different days", stats.days >= 3],
              ["Page by page", "Contribute 100 pages", stats.pages >= 100],
            ].map(([title, detail, earned]) => (
              <div
                className={`milestone ${earned ? "earned" : ""}`}
                key={title}
              >
                <span aria-hidden="true">{earned ? "✓" : "○"}</span>
                <div>
                  <strong>{title}</strong>
                  <small>
                    {detail} · {earned ? "Earned" : "To discover"}
                  </small>
                </div>
              </div>
            ))}
          </section>
          <section className="passport-panel">
            <span className="eyebrow">A reading passport</span>
            <h3>Follow your curiosity.</h3>
            <p>
              Try a poem. Explore a graphic novel. Discover an Indian author.
              Read something a friend loves.
            </p>
            <p>These are invitations. Choose what interests you.</p>
          </section>
          <section className="community-panel">
            <h3>A shared purpose</h3>
            <p>
              The school target and house participation will appear here when
              the challenge launches.
            </p>
            <p>
              Reading aloud and supported reading belong here too. The launch
              rules will explain how everyone can take part.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
