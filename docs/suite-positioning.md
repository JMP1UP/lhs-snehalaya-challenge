# 25Thirty 365 — suite positioning

## Identity

- Company: **25Thirty**.
- Suite: **25Thirty School** (`25thirty.school`).
- Product: **25Thirty 365** — learning beyond the school day.
- School experience: **LHS 365 · Leicester High School**.
- Current challenge: **Read for Snehalaya**, with **Steps to Snehalaya** retained in the collection.
- Intended product address: `365.25thirty.school` (planned, not connected by this change).

Use the product name in the application header and page metadata, with school identity shown separately. LHS 365 remains the school's programme name. Book covers, illustrations, colours and editorial headings belong to the reading challenge theme; the surrounding product navigation uses the suite's navy, teal and sans-serif identity.

## Place in the suite

365 supports pupil participation in shared challenges and habits beyond school. Enrichment manages activities and programmes; Pathways records broader experiences and development. This positioning does not imply data integration or shared authentication between products.

The suite homepage includes 365 as **in development**, separately from its five existing product demonstrations. It does not claim a public reading launch or include 365 in a purchasable complete-suite offer.

## Implementation boundary

This is a branding and suite-catalogue change across this repository and `../25thirty-school`. No repository directories, Firebase records, authentication settings, DNS records or production deployments have been moved. Session keys and existing challenge IDs remain stable. No multi-school access has been implemented.

Before switching the live address, select the production host, connect the custom domain, validate school sign-in and data boundaries, and retain a working rollback. The earlier reading-preview limitations still apply.
