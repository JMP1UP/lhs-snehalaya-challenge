# 25Thirty 365 — Read for Snehalaya at Leicester High School

Suite update: **25Thirty 365** is the product within **25Thirty School**. **LHS 365** remains the school programme. The intended product address is `365.25thirty.school`, still planned. Use suite navy/teal branding for navigation and retain the reading theme below within the school experience. See [suite positioning](suite-positioning.md).

Design brief · 9 September 2026 · Internal development preview

## 1. Purpose and direction

LHS 365 is the permanent home for learning and personal development beyond the school day. Challenges give pupils an achievable reason to explore, build habits and contribute to a shared purpose, at home as well as at school.

Read for Snehalaya is the next featured challenge. Its dominant theme is books and reading: a welcoming collection of stories, rather than a numerical exercise. The product should make starting easy, recognise steady participation and keep the school’s connection with Snehalaya visible.

The existing steps challenge is represented by a read-only history page. Its original application and records remain separate. The public 365 preview does not load that app or initialise Firebase. Reading must never reinterpret distance entries as pages.

## 2. Intended outcomes

- Pupils discover something they want to read and return to it regularly.
- Adding or updating a book feels quick enough to do without interrupting reading.
- A pupil reading a few pages sees worthwhile progress.
- The school can celebrate collective progress without exposing individual reading histories publicly.
- Each term adds a recognisable new chapter to LHS 365 instead of replacing the previous experience.

Success is broader participation and a useful reading habit, not simply the largest page count. At launch, assess participation across intended year groups, repeat reading days, book-addition completion and lookup success. Gather brief pupil and staff feedback rather than adding intrusive tracking by default.

## 3. Audience

Primary: pupils participating in the term’s reading challenge, using a phone or school computer.

Secondary: staff supporting participation and younger or supported readers; families encouraging reading outside school; visitors interested in the programme and partnership.

Final year-group scope is still to be confirmed. The preview uses pages as the core measure; if participation spans early years through sixth form, settle a minutes or supported-reading pathway before launch. Do not assign arbitrary page equivalents to audio or reading time.

## 4. Brand architecture: consistent home, distinctive challenges

### Permanent LHS 365 layer

- LHS 365 wordmark alongside the existing school identity.
- Predictable navigation, content width, buttons, form patterns, focus states and footer.
- A permanent statement of purpose: learning beyond school.
- A prominent featured challenge, followed by the challenge collection.
- Stable challenge IDs, explicit lifecycle states and separate records for each challenge.
- Plain, encouraging copy and an accessible, mobile-first experience.

### Changeable challenge layer

Each challenge supplies its title, season, category, status, accent palette, illustration language, introductory copy, activity unit and milestones. Do not communicate state through colour alone.

For reading, use paper, ink, book covers, spines, a bookshelf, chapter language and editorial typography. A future movement challenge might use routes and movement; a nature challenge might use field notes and botanical forms. These are style directions, not announced future campaigns.

The home page may adopt the featured challenge’s artwork and accents while keeping the LHS 365 structure recognisable. Avoid inventing new navigation or scoring controls each term.

## 5. Reading theme: “One more chapter”

### Visual character

Thoughtful, warm and literary. A contemporary school reading collection with tactile book details and generous space. Avoid infantile clip art, neon gaming aesthetics, competitive dashboards full of ranks, or decorative effects that make reading difficult.

### Palette

| Role | Colour | Use |
| --- | --- | --- |
| Paper | `#FAF7EF` | Main canvas |
| Ink | `#182E29` | Body and heading text |
| Forest | `#244C3D` | Featured panel and primary actions |
| Gold | `#EDCE80` | Featured heading accents and book covers |
| Sage | `#E9EDDF` | Milestone panels |
| Terracotta | `#C47B54` | Decorative book spines |
| Muted ink | `#5F6961` | Supporting text on pale backgrounds |

Gold and terracotta are decorative accents, not small body text on paper. Validate contrast for any new combinations.

### Typography

Use Georgia for expressive headlines, book titles and large reading totals; use the existing Inter/system sans-serif stack for navigation, controls and supporting copy. This works without downloading fonts. Italics add a restrained literary voice to a few headline words. Uppercase labels are short and supplementary; instructions remain sentence case.

### Illustration and layout

The featured panel pairs a clear invitation with original CSS book artwork. Illustrative cover titles are campaign artwork, not recommendations or claims about real published books. Small stars and flowers act as print-like ornaments. Book spines appear in the challenge collection. Decorative artwork is hidden from assistive technology.

Use a generous editorial opening, a two-column feature, three brief participation principles, a collection of challenge cards and an LHS 365 purpose statement. On phones, stack content and artwork without horizontal scrolling. In the reader, prioritise the bookshelf and progress form over supplementary material.

### Voice

Examples: “Find your next read”, “I’ve reached page…”, “Every page is a beginning”, “Follow your curiosity”. Use specific confirmation: “26 pages added.” Avoid pressure about missed days, claims of verified reading, or praise based only on speed.

## 6. Information architecture

| Destination | Purpose |
| --- | --- |
| LHS 365 home (`#/`) | Explain the programme, feature reading, browse the collection |
| Reading (`#/reading`) | Add books, record progress, see personal milestones |
| Steps (`#/steps`) | Read the closed challenge history, without loading original pupil records |

The challenge catalogue is the source of titles, status and destination links. The first implementation has two entries. Additional challenges need their own activity experience; a new catalogue entry alone does not create one.

## 7. Key journeys

### Discover and join

Open LHS 365 → see the featured reading challenge and its current status → explore → understand what counts → add the first book. The preview labels its temporary storage and lack of school submission explicitly. The live version will require school-authorised sign-in before saving personal reading data.

### Add a book

Search by title, author or typed ISBN, or enter details manually. Select a result and confirm the title, author and page count against the actual edition. Enter the page already reached; 0 means a new book. Existing pages establish a starting point and do not contribute retroactively.

Google Books supplies suggestions. Page counts are not guaranteed and must remain editable before addition. Missing or failed search must never block manual addition. The search sends only the query to the catalogue provider; pupil identity and reading history must not be included. Camera barcode scanning is a later enhancement.

Reference: [Google Books volume metadata](https://developers.google.com/books/docs/v1/reference/volumes). Catalogue availability is an external dependency; the browser check on 9 September returned the unavailable state, so successful live lookup is not yet verified.

### Update progress

Choose a book → enter the page reached → save → see the new contribution and updated total. Example: 42 to 68 adds 26 pages. Repeating 68 adds nothing and is rejected. Values beyond the book’s length, negative numbers and fractions are rejected. Finishing counts only the remaining pages and awards completion once.

### Review achievements

The personal summary shows pages contributed, books finished and distinct days with logged reading. Milestones celebrate first progress, a first completed book, three reading days and 100 contributed pages. Distinct days are not a streak; missing a day does not reset an achievement.

### Correct a mistake — required for live release

Provide an explicit correction flow that recalculates affected totals. Record corrections with appropriate ownership and audit history. Do not let a page-count edit silently increase the school total. The initial preview does not yet provide editing, deletion or backdated reading sessions.

## 8. Challenge rules and inclusion

- Pages represent activity, not reading ability, understanding or educational attainment.
- A book already in progress contributes only pages read after it is added.
- Reading days in the preview mean local calendar dates on which progress is logged; logging time is not proof of when reading happened.
- Completion requires actual contributed progress. Adding a previously finished book does not earn credit.
- Poetry, nonfiction, graphic novels and books in other languages belong in the challenge.
- Do not convert audio minutes to pages using invented factors. Decide and explain the inclusive pathway before launch.
- Support reading aloud and shared reading through a defined staff/class pathway at launch; prevent double-counting with pupil records.
- For ebooks, use consistent edition pagination. Percentage-based logging is outside the first preview.
- Rereads need a deliberate new reading record and an agreed rule before live scoring.
- Book recommendations and passport suggestions are optional. Do not make quizzes or reviews a condition of contributing.

## 9. Collective progress and Snehalaya

Proposed live measures: a collective page target, total completed books and house participation. Prefer participation rate using an agreed eligible cohort to an unqualified raw house page ranking. Do not display invented totals, donors, testimonials or target figures.

Set the target after checking the intended cohort, term duration and a realistic sample of reading participation. Show aggregate progress only when it is derived reliably from authorised records. Personal reading histories remain private by default.

Use school-selected reading and approved partnership updates to connect the challenge with Snehalaya. If fundraising is included, keep pledges and received money separate and explain the sponsorship basis and cap. The preview makes no claim that pages automatically raise money.

## 10. Accessibility and privacy

- Semantic headings, named navigation, native labels and buttons.
- Visible keyboard focus and a working skip link; use colour plus text for state.
- Native progress elements labelled with book titles.
- Touch-friendly controls, responsive forms and reduced-motion support.
- Announce search results, saving outcomes and validation errors without relying on animation.
- No public pupil reading lists, names or rankings by default.
- No real pupil data in the development preview. Session storage is temporary, is visible to someone using the same tab, and is not a secure personal account.
- Live ownership and school access must be enforced by backend rules, not browser state or display names.

## 11. States to design and verify

Empty bookshelf; book added; partly read; completed; missing page count; no search results; unavailable or slow catalogue; invalid input; duplicate progress; failed session save; corrupt saved data; narrow mobile screen; keyboard-only navigation.

For live release, additionally cover sign-in failure, unauthorised school access, expired sessions, offline writes, concurrent updates, corrections, staff permissions and aggregate reconciliation.

## 12. Scope delivered in the first build

Implemented: themed LHS 365 front end; challenge catalogue; featured reading and closed steps links; bookshelf; Google Books search with manual fallback; starting page; incremental progress; completion and reading-day milestones; temporary session persistence; input and saved-record validation; responsive styling; automated reading calculation tests.

Not yet implemented: cloud reading records, school/house aggregates, campaign target, staff reading tools, persistent personal goals, recommendations/moderation, camera scanning, corrections, reread rules, audiobook/minutes pathway, offline/concurrent synchronisation. These must not be presented as working in the preview.

## 13. Acceptance criteria

1. Visitors understand LHS 365 and can distinguish the reading preview from the closed steps challenge.
2. Reading is unmistakably book-themed while navigation and controls remain reusable.
3. A user can add a fictional book manually even when catalogue search fails.
4. A 42 → 68 update contributes exactly 26 pages; completing does not double-count.
5. The bookshelf survives a refresh in the same tab when session storage is available.
6. Impossible, duplicate or contradictory progress is rejected with a useful message.
7. No fabricated shared totals or claims of school submission appear.
8. Desktop and phone layouts are readable and keyboard controls function.
9. Existing steps code and live records remain intact.

## 14. Launch decisions and next action

John Partridge remains the sole developer and final decision-maker. Review the preview with fictional data, then settle the intended year groups, term dates, inclusion rules and school target. Autumn 2026 is the current design assumption, not a published schedule.

Before collecting real reading records, implement private school-scoped storage, corrections and tested aggregates; perform the existing proportional release process. Keep one concise operational checklist in `docs/release-checklist.md`. No deployment or live-data migration is part of this design preview.
