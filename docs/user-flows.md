# LHS Snehalaya Challenge — Main User Flows

> **A 25Thirty product**

## 1. Student Challenge Entry & House Point Logging
- **User**: Student / House Member
- **Starting Point**: Challenge Dashboard
- **Intended Outcome**: Record a fundraising activity (e.g. Sponsored Walk or Bake Sale) towards house total.
- **Steps**:
  1. Student signs in via Microsoft Entra ID.
  2. Student taps "Log activity".
  3. Student inputs activity title, house team, distance/pledge amount, and optional photo attachment.
  4. Student taps "Submit entry".
- **Decisions**: Select house team, attach photo evidence.
- **Error States**: Missing pledge amount or activity title -> display inline validation prompt.
- **Completion State**: Activity saved to house timeline and fundraising meter updated.

## 2. House Leaderboard & Campaign Progress Inspection
- **User**: Student / Staff Member
- **Starting Point**: House Leaderboard Page
- **Intended Outcome**: View real-time house totals, top challenges, and campaign milestones.
- **Steps**:
  1. User navigates to Leaderboard.
  2. Leaderboard presents total target bar and house comparison columns.
  3. User selects house card to view contributing student activities.
- **Decisions**: Filter by house team or challenge type.
- **Error States**: None (live real-time Firestore sync).
- **Completion State**: Leaderboard metrics rendered cleanly.
