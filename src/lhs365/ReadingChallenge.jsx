import { useEffect, useRef, useState } from "react";
import {
  createBook,
  localDate,
  persistBooks,
  progressPage,
  readingStats,
  restoreBooks,
  STORAGE_KEY,
  updateBook,
} from "./reading.mjs";
import BookTower from "./BookTower";
import { searchBooks } from "./catalogue.mjs";
import { formatHeight, PAGE_HEIGHT_MM } from "./tower.mjs";

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

function BookCard({ book, onUpdate, onRemove }) {
  const [page, setPage] = useState("");
  const [choice,setChoice] = useState("exact");
  const [saving,setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmRemove,setConfirmRemove]=useState(false);
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
            {book.estimated ? "Approx. page" : "Page"} {book.current} of {book.total}
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
                await onUpdate(progressPage(book.total,choice,page),!["all","exact"].includes(choice));
                setPage("");
                setChoice("exact");
                setError("");
              } catch (err) {
                setError(err.message);
              } finally { setSaving(false); }
            }}
          >
            <ProgressChoice id={`progress-${book.id}`} choice={choice} onChange={setChoice} total={book.total} current={book.current}/>
            {choice === "exact" && <label htmlFor={`page-${book.id}`}>I’ve reached page</label>}
            <div className="input-action">
              {choice === "exact" && <input
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
              />}
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
        {onRemove && (!confirmRemove ? <button type="button" className="text-link remove-book" onClick={()=>setConfirmRemove(true)}>Remove book</button> : <div className="remove-confirm" role="group" aria-label={`Remove ${book.title}`}><p>Remove this book and subtract its pages?</p><button type="button" className="button secondary" onClick={()=>setConfirmRemove(false)}>Keep it</button><button type="button" className="button danger" disabled={saving} onClick={async()=>{try{setSaving(true);await onRemove();}catch(err){setError(err.message);setConfirmRemove(false);}finally{setSaving(false);}}}>Remove book</button></div>)}
        {error && finished && <p className="form-error" role="alert">{error}</p>}
      </div>
    </article>
  );
}

function ProgressChoice({id,choice,onChange,total,current=0,includeFinished=true}) {
  return <label htmlFor={id}>Reading progress<select id={id} value={choice} onChange={event=>onChange(event.target.value)}>
    {includeFinished && <option value="all">Finished it</option>}
    {[['10','Just started — about 10%'],['25','About a quarter — 25%'],['50','Halfway — 50%'],['75','Nearly finished — about 75%']].map(([value,label])=><option key={value} value={value} disabled={Number(total)>0 && (Number(total)<2 || Math.max(1,Math.min(Number(total)-1,Math.round(Number(total)*Number(value)/100)))<=current)}>{label}</option>)}
    <option value="exact">Enter page number</option>
  </select></label>;
}

export default function ReadingChallenge({ repository, community=null }) {
  const [initial] = useState(() => repository ? {books:repository.books,error:""} : initialShelf());
  const [saving,setSaving] = useState(false);
  const addRequest = useRef(null);
  const [books, setBooks] = useState(initial.books);
  const [family,setFamily]=useState(repository?.family||null);
  const [reader,setReader]=useState("me");
  const [familyOpen,setFamilyOpen]=useState(Boolean(repository && new URLSearchParams(window.location.hash.split("?")[1]||"").get("family")));
  const inviteCode=repository ? new URLSearchParams(window.location.hash.split("?")[1]||"").get("family")||"" : "";
  const [familyInput,setFamilyInput]=useState(inviteCode);
  const [inviteOpen,setInviteOpen]=useState(Boolean(inviteCode));
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
  const [stillReading,setStillReading]=useState(false);
  const [progressChoice,setProgressChoice]=useState("50");
  const [initialPage,setInitialPage]=useState("");
  const [error, setError] = useState("");
  const searchId = useRef(0);
  const addButton = useRef(null);
  const visibleBooks = repository ? books.filter(book=>reader==="me"?!book.familyReaderId:book.familyReaderId===reader) : books;
  const stats = readingStats(visibleBooks);
  const familyStats = readingStats(books.filter(book=>book.familyReaderId));
  const personalStats = readingStats(books.filter(book=>!book.familyReaderId));
  const booksLabel=count=>`${count.toLocaleString()} ${count===1?"book":"books"}`;
  const activeBooks = visibleBooks.filter((book) => book.current < book.total);
  const readerName=reader==="me"?"You":family?.readers?.find(item=>item.id===reader)?.name||"Family";
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

  function applyFamily(next) {
    const personal=currentBooks.current.filter(book=>!book.householdId);
    const merged=[...personal,...(next.books||[])];
    currentBooks.current=merged;setBooks(merged);setFamily(next);setFamilyOpen(false);setFamilyInput("");
  }

  async function shareFamilyInvite() {
    const url=`${window.location.origin}${window.location.pathname}#/reading?family=${family.joinCode}`;
    const text=`Join our LHS 365 family reading group. Sign in with your Leicester High account.`;
    try {
      if(navigator.share)await navigator.share({title:"Join our LHS 365 family",text,url});
      else {await navigator.clipboard.writeText(`${text}\n${url}`);setNotice("Family invite copied.");}
    } catch(err) {if(err?.name!=="AbortError")setError("The invite could not be shared. Copy the code instead.");}
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
      {!repository && <div className="preview-note">Preview · Fictional data stays in this tab</div>}
      {repository&&<section className="progress-overview" aria-labelledby="progress-overview-title">
        <span className="eyebrow" id="progress-overview-title">WHERE WE ARE NOW</span>
        <div className="progress-levels">
          <article><span>You</span><strong>{personalStats.pages.toLocaleString()} pages</strong><small>{booksLabel(personalStats.finished)}</small></article>
          {family&&<article><span>Your family</span><strong>{familyStats.pages.toLocaleString()} pages</strong><small>{booksLabel(familyStats.finished)}</small></article>}
          <article className="school-progress"><span>Whole school</span>{community?<><strong>{formatHeight(community.pages*PAGE_HEIGHT_MM)} high</strong><small>{community.pages.toLocaleString()} pages · {booksLabel(community.finished)}</small></>:<><strong>Building…</strong><small>Community tower</small></>}</article>
        </div>
      </section>}
      {repository&&<section className="family-reading" aria-label="Choose reader">
        <div className="reader-switch">
          <button type="button" aria-pressed={reader==="me"} onClick={()=>setReader("me")}>Me</button>
          {family?.readers?.map(person=><button type="button" key={person.id} aria-pressed={reader===person.id} onClick={()=>setReader(person.id)}>{person.name}</button>)}
          <button type="button" className="family-add" onClick={()=>{setFamilyOpen(value=>!value);setInviteOpen(false);setError("");}}>+ {family?"Reader":"Set up family"}</button>
          {family&&<button type="button" className="family-invite" onClick={()=>{setInviteOpen(value=>!value);setFamilyOpen(false);setError("");}}>Invite sibling</button>}
        </div>
        {familyOpen&&!family&&<div className="family-setup family-choice"><article><h3>Start a family group</h3><p>Create one shared space, then invite school siblings to join it.</p><button type="button" className="button primary" disabled={saving} onClick={async()=>{setSaving(true);setError("");try{applyFamily(await repository.createFamily());setInviteOpen(true);}catch(err){setError(err.message);}finally{setSaving(false);}}}>Start our family</button></article><form onSubmit={async event=>{event.preventDefault();setSaving(true);setError("");try{applyFamily(await repository.joinFamily(familyInput));setInviteOpen(false);window.history.replaceState(null,"",`${window.location.pathname}#/reading`);}catch(err){setError(err.message);}finally{setSaving(false);}}}><h3>Join your family</h3><p>Use the invite link or code from a school sibling.</p><label htmlFor="family-code">Invite code</label><div className="input-action"><input id="family-code" value={familyInput} maxLength="12" required onChange={event=>setFamilyInput(event.target.value)} placeholder="10-character code"/><button className="button secondary" disabled={saving}>Join family</button></div></form>{error&&<p role="alert">{error}</p>}</div>}
        {family&&inviteOpen&&<div className="family-setup family-invite-panel"><div><h3>Invite a school sibling</h3><p>Send the invite. They sign in with their own Leicester High account and join this same family.</p><p>Invite code: <code>{family.joinCode}</code></p></div><button type="button" className="button primary" onClick={shareFamilyInvite}>Share or copy invite</button>{error&&<p role="alert">{error}</p>}</div>}
        {familyOpen&&family&&<form className="family-setup" onSubmit={async event=>{event.preventDefault();setSaving(true);setError("");try{const next=await repository.addFamilyReader(familyInput);applyFamily(next);setReader(next.readers.at(-1).id);}catch(err){setError(err.message);}finally{setSaving(false);}}}><label htmlFor="family-name">Family member’s name</label><div className="input-action"><input id="family-name" value={familyInput} maxLength="50" required onChange={event=>setFamilyInput(event.target.value)} placeholder="e.g. Mum"/><button className="button primary" disabled={saving}>Add</button></div>{error&&<p role="alert">{error}</p>}</form>}
      </section>}
      <div className={`reading-workspace ${activeBooks.length ? "" : "reading-workspace-empty"}`}>
      <div className="reading-layout">
        <section>
          <div className="section-heading">
            <div>
              <h2>{reader==="me"?"Log your reading":`Log for ${readerName}`}</h2>
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
              + Log a book
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
              <details className="book-search-panel">
                <summary>Find book automatically</summary>
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
                  Uses Google Books and Open Library · Avoid personal information
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
              </details>
              <form
                className="manual-book"
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    if (saving) return;
                    const page=progressPage(draft.total,stillReading?progressChoice:"all",initialPage);
                    const estimated=stillReading && !["all","exact"].includes(progressChoice);
                    const base = createBook({...draft,start:"0"});
                    setSaving(true);
                    const finishedDraft = {...draft,start:"0",completed:page===base.total,page,estimated};
                    const fingerprint = JSON.stringify(finishedDraft);
                    if (addRequest.current?.fingerprint !== fingerprint) addRequest.current = {fingerprint,id:crypto.randomUUID()};
                    const book = repository
                      ? await repository.add(finishedDraft,addRequest.current.id,reader==="me"?null:reader,stats.pages===0)
                      : {...updateBook(base,page,localDate()),estimated};
                    addRequest.current = null;
                    save(
                      [...currentBooks.current.filter(item => item.id !== book.id), book],
                      `Logged ${book.title}.`,
                    );
                    setDraft({ title: "", author: "", total: "", start: "0" });
                    setStillReading(false);setProgressChoice("50");setInitialPage("");
                    setQuery("");
                    setResults([]);
                    setSearchMessage("");
                    closeForm();
                  } catch (err) {
                    setError(err.message);
                  } finally { setSaving(false); }
                }}
              >
                <h4>Book details</h4>
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
                <label htmlFor="book-status">Book status<select id="book-status" value={stillReading?"reading":"finished"} onChange={event=>setStillReading(event.target.value==="reading")}><option value="finished">Finished it</option><option value="reading">Still reading</option></select></label>
                {stillReading && <><ProgressChoice id="book-progress" choice={progressChoice} onChange={setProgressChoice} total={draft.total} includeFinished={false}/>{progressChoice==="exact" && <label htmlFor="book-page">I’ve reached page<input id="book-page" type="number" min="1" max={draft.total||20000} step="1" required value={initialPage} onChange={event=>setInitialPage(event.target.value)}/></label>}{!["all","exact"].includes(progressChoice)&&<small>Estimated pages</small>}</>}
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="button primary" disabled={saving}>{saving ? "Saving…" : stillReading ? "Log reading" : "Log finished book"}</button>
              </form>
              </fieldset>
            </section>
          )}
          {visibleBooks.length === 0 && !adding && (
            <div className="empty-shelf">
              <span aria-hidden="true">Aa</span>
              <h3>What are you reading?</h3>
            </div>
          )}
          <div className="books-list">
            {activeBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onUpdate={async (page,estimated) => {
                  const next = repository ? await repository.update(book.id,page,estimated) : {...updateBook(book,page,localDate()),estimated:page===book.total?false:estimated};
                  const completed = next.current === next.total;
                  save(
                    currentBooks.current.map((item) => (item.id === next.id ? next : item)),
                    completed
                      ? `${next.current - book.current} pages added. Finished ${next.title}.`
                      : `${next.current - book.current} pages added.`,
                  );
                  if (completed) focusFinished.current = true;
                }}
                onRemove={async()=>{const removed=repository?await repository.remove(book.id,stats.pages===book.current-book.start):book;save(currentBooks.current.filter(item=>item.id!==book.id),`Removed ${book.title}.`);return removed;}}
              />
            ))}
          </div>
          {visibleBooks.some((book) => book.current === book.total) && (
            <details className="finished-books">
              <summary ref={finishedSummary}>Finished books ({visibleBooks.filter((book) => book.current === book.total).length})</summary>
              {visibleBooks.filter((book) => book.current === book.total).map((book) => (
                <BookCard key={book.id} book={book} onRemove={async()=>{const removed=repository?await repository.remove(book.id,stats.pages===book.current-book.start):book;save(currentBooks.current.filter(item=>item.id!==book.id),`Removed ${book.title}.`);return removed;}} />
              ))}
            </details>
          )}
        </section>
      </div>
        <div className="reading-mission-column">
      <BookTower pages={stats.pages} books={visibleBooks} preview={!repository} />
      <section className="reading-stats" aria-label="Your reading progress">
        {[
          [reader==="me"?"Your pages":`${readerName}’s pages`, stats.pages],
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
