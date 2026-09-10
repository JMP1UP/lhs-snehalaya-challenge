# 25Thirty 365 — published design preview

Date: 10 September 2026. Owner: John Partridge. Classification: external pilot of a design preview, fictional entries only. This is not a real-pupil pilot.

## Current publication

- Public preview: `https://25thirty-365.vercel.app`.
- Host: separate Vercel project `25thirty-365` (`prj_YXRk7mn2TC6sPgv5iPYx1pTEsyJq`).
- Deployment: `dpl_ERCTmbQZZJ5zCSTPc9qDFUH1H5GE`, `25thirty-365-guq0gkq7d-john-s-projects7.vercel.app`.
- Suite: `https://25thirty.school/#365`, with a working preview link.
- Custom address: `365.25thirty.school`, associated with this project but awaiting DNS.

The bright Steps-brand home is the default route, with the separate reading theme at #/reading. Desktop and 390px mobile checks confirm layouts, reading entry, saved progress and archive navigation. Hosted lint, 19 tests and production build passed. The earlier browser outage is resolved.

## Completed checks

- New frontend lint, 22 reading/catalogue/tower tests and Vite build pass locally and on Vercel.
- Public preview returns HTTP 200 and `X-Robots-Tag: noindex, nofollow`.
- Delivered JavaScript contains the static archive and no Firebase project/auth/Firestore code.
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

Previous preview rollback: `25thirty-365-ojtrcxulu-john-s-projects7.vercel.app`; the original steps site remains the historical fallback. To withdraw this preview, remove its suite link and unpublish/disable only the new Vercel project. Do not deploy the root Firebase configuration: `.firebaserc` still names the original steps project.

Future Vercel deployments use `vercel.json` to run reading lint, tests and build. Keep `.vercel` and `.env.local` ignored. Persistent school data, corrections, shared totals and real-pupil permissions still require separate implementation and approval before a school pilot.

Book search now falls back to Open Library when Google Books fails. Live Dune lookup and editable estimated pages verified; the former live-search blocker is resolved via fallback. Google itself still returns quota exhaustion.
