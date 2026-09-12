# 25Thirty 365 — published design preview

Date: 10 September 2026. Owner: John Partridge. Classification: external pilot of a design preview, fictional entries only. This is not a real-pupil pilot.

## Current publication

- Public preview: `https://25thirty-365.vercel.app`.
- Host: separate Vercel project `25thirty-365` (`prj_YXRk7mn2TC6sPgv5iPYx1pTEsyJq`).
- Deployment: `dpl_H5QsQrdBnBN8sZZw5hwC9U44ACHQ`, `25thirty-365-gepswgys9-john-s-projects7.vercel.app`.
- Suite: `https://25thirty.school/#365`, with a working preview link.
- Custom address: `365.25thirty.school`, associated with this project but awaiting DNS.

The bright Steps-brand home is the default route, with the separate reading theme at #/reading. Desktop and 390px mobile checks confirm layouts, reading entry, saved progress and archive navigation. Hosted lint, 33 tests and production build passed. The earlier browser outage is resolved.

## Completed checks

- New frontend lint, 33 reading/catalogue/tower/admin/API tests and Vite build pass locally and on Vercel.
- Public preview returns HTTP 200 and `X-Robots-Tag: noindex, nofollow`.
- The disabled-live preview bundle contains the static archive and fictional admin data; Firebase client auth is excluded by the preview build flag. The new server endpoint is deployed but disabled.
- Independent implementation review found two issues; static history and separate Vercel hosting corrected both. One verification review passed.
- Original Firebase site, authentication and pupil records were not changed. No migration or live-data writes occurred. Fictional session entries from localhost do not transfer to the hosted origin.

## Remaining domain action

Sign in to Cloudflare for `25thirty.school`, then add the exact record returned by Vercel:

| Field | Value |
| --- | --- |
| Type | CNAME |
| Name | `365` |
| Target | `bce0c756752aef8e.vercel-dns-017.com` |
| Proxy | DNS only (off) |
| TTL | Auto |

Do not change nameservers, the root domain or other product records. There were no conflicting `365` records when checked. After saving, run `vercel domains verify 365.25thirty.school`, verify public HTTPS and the preview response, then switch the suite's preview link to the custom address. Cloudflare was still at sign-in when this record was prepared.

## Rollback and future changes

Previous preview rollback: `25thirty-365-dg7lyovz3-john-s-projects7.vercel.app`; the original steps site remains the historical fallback. To withdraw this preview, remove its suite link and unpublish/disable only the new Vercel project. Do not deploy the root Firebase configuration: `.firebaserc` still names the original steps project.

Future Vercel deployments use `vercel.json` to run reading lint, tests and build. Keep `.vercel` and `.env.local` ignored. The shared reading API and Microsoft login are enabled for a controlled school pilot. The roster is an auditing and grouping tool rather than a sign-in gate; see reading-admin.md for the remaining operational checks.

Book search now falls back to Open Library when Google Books fails. Live Dune lookup and editable estimated pages verified; the former live-search blocker is resolved via fallback. Google itself still returns quota exhaustion.

## Admin preview release

`#/admin` now has a clearly labelled fictional dashboard. Desktop browser checks verified separate ten-row rankings, combined filters, empty search results and no overflow. Reading regression: a fictional 100-page book starting at page 20 contributed exactly 80 pages and one finished book; focus moved to Finished books. 33 tests, scoped lint, preview build and live-mode compilation passed. Independent review and correction verification passed. No claim is made for live sign-in or school records; mobile visual verification of the new dashboard is still pending.

The server allowlist contains the two requested admin accounts. Live flags and service credentials remain absent. Hosted API check returns JSON 503 with private/no-store headers, as intended while disabled. Vercel Node 24 with NODE_OPTIONS=--experimental-require-module resolves the Firebase dependency loading failure caught in the first hosted smoke check. Latest validated deployment is listed above; do not roll back to the intermediate 4y5caA86inKmdJDqMmcoQgGw29bg deployment with that runtime failure.

House leaderboard visual correction: rank/name alignment, consistent report heading sizes, slim styled purple bars and clearer reader statistics. Desktop screenshot verified; scoped lint, all 33 tests and production build pass. This remains a fictional-data external preview.

## Launch-ready fictional preview — 12 September 2026

The public experience now includes the LHS 365/Snehalaya story, verified historical Steps result, current reading-project status, graphic-novel reading interface, screenshot-ready community tower, aggregate teacher form view, and administrator participation/roster tools. Browser journeys covered visitor, keen reader, quick logger, teacher and administrator personas at phone width. Progress survived reload; two consecutive additive roster imports preserved earlier entries. The dependency lock was refreshed without a major application migration and `npm audit --omit=dev` reports zero known vulnerabilities. All 40 focused tests, reading lint and the production build pass locally and in Vercel. Public smoke checks returned HTTP 200 with `X-Robots-Tag: noindex, nofollow`; `/api/reading` returned the expected private JSON 503 while live mode is disabled. No browser-console errors were reported.

## Controlled live school pilot — 12 September 2026

Production deployment `dpl_7dm9mkAkGtYVyLqQPuSrKDzF547T` enables Microsoft school login and the private reading API. Any verified `@leicesterhigh.co.uk` Microsoft account may log reading; admin reporting remains separately allowlisted and staff form reporting remains roster-role controlled. Unmatched school logins are highlighted privately for reconciliation, and their pages count in the community tower without changing roster/form/house denominators. The anonymous API returns 401 and anonymous direct Firestore REST access returns 403. All 41 focused tests, scoped lint and the production build pass locally and in Vercel. Real-account completion, external-account rejection, sign-out, multi-device save and restore checks remain open in reading-admin.md.
