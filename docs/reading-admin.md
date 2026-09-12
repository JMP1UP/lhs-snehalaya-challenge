# Reading admin: operation and release

Owner: John Partridge. 10 September 2026.

## Current status

The public role preview at `#/admin` uses 40 fictional readers. Its teacher view contains aggregate school/form-group figures only; its administrator view demonstrates rankings, participation checks, filters, CSV export and additive roster imports. No live pupil data is bundled or imported. The shared reading API and Microsoft sign-in flow are implemented but default OFF. This is an external design-preview release, not a live pupil rollout.

Admin access is intended for j.partridge@leicesterhigh.co.uk and a.mcmurray@leicesterhigh.co.uk, stored only in the server environment allowlist. A complete roster has not been supplied. Non-contributors cannot be inferred from login history.

## Configuration

Server-only Vercel environment variables (never prefix with VITE_):

- `READING_LIVE_ENABLED`: enable only for the controlled internal pilot after the checks below.
- `READING_ADMIN_EMAILS`: comma-separated exact authorised school addresses.
- `READING_FIREBASE_PROJECT_ID`: explicitly selected Firebase project.
- `READING_FIREBASE_SERVICE_ACCOUNT`: secret service-account JSON for that same project. Use a dedicated identity with only necessary Firestore and Firebase Auth verification/user-read permissions. Do not commit the key.

Public build-time configuration:

- `VITE_READING_LIVE=true` to show school sign-in instead of the session preview.
- `VITE_READING_FIREBASE_CONFIG`: JSON public Firebase web configuration, matching the server project.
- `VITE_READING_MICROSOFT_TENANT`: the school's Microsoft tenant ID.

Configure the Microsoft provider to the school tenant and authorise the deployment hostname in Firebase Auth. The client tenant parameter is not the access-control boundary: the API verifies a Firebase ID token with revocation checks, the Microsoft provider and a verified Leicester High email. Any verified school account may use the reading challenge; the roster supplies school grouping and participation denominators, not basic access. Admin access still requires the server allowlist, and staff aggregate access requires an active staff roster record. Verify actual tenant isolation in the pilot. In live mode, missing configuration fails closed; it never falls back to local preview storage. Signing out clears the displayed report/bookshelf. Admin names and roster records are not public endpoints.

## Data and roster

Only `readingCampaigns/read-for-snehalaya-2026/**` is accessed by the new server. The original steps collections, site, auth code and rules are unchanged. The existing rules have no match for this namespace, so direct client access is denied; verify deployed rules before enabling live. Do not deploy the root Firebase configuration as part of this release.

`settings/roster` holds one versioned document: people (up to 1,000), complete flag, version, updatedAt. Each person has email, name, kind (student/staff), house, yearGroup, formGroup and active. IDs are hashes of normalised emails. Students require a named house, EYFS or Year 1–13, and a form group. Staff can use house None and may have a form group. Houses: Beaumanor, Bradgate, Charnwood. Books are linked to these server-generated IDs. `members/{id}` tracks the 200-book pilot limit. `books/{id}` contains validated current/start/total pages and server-dated positive deltas. The report supports up to 10,000 books and fails visibly beyond that limit.

Admin imports JSON, CSV or TSV through Manage the school roster. Add or update is the default: matching normalised school emails are updated and omitted people remain, so later uploads can safely add new joiners. Full replacement is a separate, explicitly confirmed action. A trailing `(staff)` marker can classify an imported row, but it is stripped from the stored name and never grants access by itself. Duplicate emails and invalid fields are rejected. Stale roster versions cannot overwrite a newer import. Removing a person disables their logging but does not delete books. Unmatched books are flagged; inactive readers are excluded from active totals. Keep roster exports within approved school storage. CSV downloads contain personal data in live mode and remain the administrator's responsibility.

Start from `docs/reading-roster-template.csv`. Replace its fictional rows inside approved school storage; do not commit or email the completed roster. Upload the approved file through the private administrator interface after verified sign-in.

An added book with no new pages remains a non-contributor. Starting pages never count retrospectively. The community tower includes reading from every verified school account. Rankings, houses, forms and participation percentages use matched active roster members only. The admin report highlights valid school accounts that have signed in but are not on the roster, so they can be reconciled. Form-group competition uses average pages per active student and also shows participation percentage, alongside the all-student school equivalents. Verified rostered staff can view these aggregate form figures; individual rankings, reconciliation emails and non-contributor names remain admin-only and are never published to students. Staff authority uses verified identity plus the stored roster role, not an editable login display name.

## One pilot checklist

- [x] Fictional reports, arithmetic, role split, roster validation, CSV escaping, and server authorization/ownership/idempotency tested locally.
- [x] Independent review completed; live privacy wording and draft-edit protection corrected and verified.
- [x] Configure matching server credentials, school Microsoft tenant/provider and authorised hostnames in the controlled production environment; live flags enabled 12 September 2026.
- [ ] Confirm direct reading Firestore reads/writes are denied for student and admin browser clients. Anonymous REST access is confirmed denied with 403; API access without sign-in returns 401.
- [ ] Verify both named admins can view reports; a normal school account and an external/other-tenant account cannot retrieve admin data. Verify revocation and sign-out. These are not established by mocked tests.
- [ ] Import an approved complete roster from school storage, or explicitly keep the partial-roster label. No pupil records have been supplied yet.
- [ ] With fictional enrolled accounts, sign in, add a book, update pages, retry a save and reconcile the report. Test a second device, account switching and failed network save.
- [ ] Record current/rollback deployment and take a restorable backup before replacing any live roster or records. Test restore in isolation if live data is at risk.
- [ ] John decides the pilot is ready after these operational checks. Corrections, retention and shared student-facing totals remain future work.

Emergency stop: set READING_LIVE_ENABLED=false to stop all API access, and deploy the preview build with VITE_READING_LIVE unset/false. Retain data; do not delete collections to roll back. Follow docs/deployment.md for the static preview rollback deployment.

Use `npm test`, `npm run lint:reading`, and `npm run build` before releasing changes. Whole-repo lint has pre-existing legacy App.jsx failures; there is no TypeScript type-check. Live API development needs a Vercel-compatible server runtime; plain Vite serves only the frontend.

Hosting pins Node 24.x. Set NODE_OPTIONS=--experimental-require-module in Vercel: Firebase Admin 14 uses a dependency that requires ESM from CommonJS. Vercel disables this interop by default; see [Vercel runtime guidance](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration). A hosted disabled-endpoint request must return JSON 503, not FUNCTION_INVOCATION_FAILED.
