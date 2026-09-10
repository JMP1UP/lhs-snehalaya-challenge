# LHS Snehalaya Challenge — Product Design

> **by 25Thirty**

## September 2026 — LHS 365 and challenge themes

The new programme home is LHS 365. Its reading challenge uses the book-led visual system specified in [the full reading design brief](reading-design-brief.md): warm paper, forest green, serif display typography, illustrated covers and spines. This is the current direction for the new frontend, superseding the older navy/Inter-only treatment below for those pages. Shared navigation and interaction patterns remain consistent; each challenge can refresh its palette, artwork and editorial language. The existing steps app retains its original design.

## 1. Product Purpose
LHS Snehalaya Challenge is a student fundraising, community engagement, and cultural partnership platform. It tracks student fundraising activities, house team progress, sponsor pledges, and cultural updates connecting Leicester High School with Snehalaya.

## 2. Intended Users & Needs
- **Students & School Houses**: Need an encouraging, transparent leaderboard, progress tracker, and activity logging space.
- **Staff Coordinators & Fundraisers**: Need verified pledge tracking, activity approvals, and event announcements.
- **Accessibility Needs**: High-contrast text, clear visual progress bars, screen-reader friendly milestone status, accessible focus states, and simple navigation.

## 3. Design Mode: 25Thirty Learning
LHS Snehalaya Challenge strictly adheres to the **25Thirty Learning** design mode.

- **Intended Feeling**: Welcoming, purposeful, safe, engaging, inclusive, age-appropriate.
- **Primary Surfaces**:
  - Header & Navigation: 25Thirty Navy (`#07111F`).
  - Background Surfaces: Warm White (`#FAF8F2`) and Pure White (`#FFFFFF`).
  - Action Triggers: 25Thirty Teal (`#2D9C91`) for "Log activity", "Sponsor house", and "View progress".
- **Supporting Accents**:
  - House & Challenge Accents: Sunshine Yellow, Coral, Purple, and Green for house team identity and fundraising progress cues.
- **Typography**: Inter (`font-family: Inter, Arial, Helvetica, sans-serif`). Sentence case for all headings, labels, and buttons.
- **Emojis**: Restrained use for activity logging (e.g. 🏃 Run/Walk, 🧁 Bake Sale, 📚 Book Sale).

## 4. Key Screens & Features
1. **Public Splash & Campaign Overview**: Inspiring overview of the Snehalaya partnership, fundraising total meter, and sign-in button.
2. **House Leaderboard & Progress**: Interactive team standings chart showing house totals and active student challenges.
3. **Student Activity Log**: Entry form for logging fundraising events, distance challenges, or sponsorship pledges.
4. **Cultural Updates Feed**: Gallery of verified posts and news updates from the Snehalaya community exchange.

## 5. Copy Style & Voice
- Direct, encouraging, purposeful, age-appropriate language.
- Examples:
  - *See how your house is performing*
  - *Log your challenge entry*
  - *Read updates from Snehalaya*
  - *Track fundraising goal*
- Avoid childish praise or corporate jargon.

## 6. Accessibility & Security Standards
- **WCAG AA Compliance**: Ensure high contrast ratio across progress meters and white card backgrounds.
- **Focus Ring**: Clear 2px teal focus ring (`ring-2 ring-[#2D9C91]`) on interactive controls.
- **Public Privacy**: Public splash hides personal student data until signed in via Microsoft auth.
- **Mobile Responsive**: Flex layout collapsing cleanly to mobile screen viewports.

## 7. Branding Standards
- Product Name: **LHS Snehalaya Challenge**
- Endorsement: **by 25Thirty** (Header), **A 25Thirty product** (Footer)

## Reading admin — 10 September 2026

Reading admin uses the bright LHS 365 navy, magenta and yellow palette. Four compact totals lead into the largest contributor, separate student/staff top tens, three house cards and a private no-pages list. Filters affect every report. Fictional preview status remains prominent; live data is accessible only after school admin sign-in.
