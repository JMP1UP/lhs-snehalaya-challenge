# Architecture decisions

## 2026-08-01 — Use Microsoft identity and Firestore

**Status:** Accepted for the current implementation

MSAL establishes identity and Cloud Firestore stores shared challenge records. Firestore rules, not React route state, determine access.

## 2026-08-01 — Distinguish pledges, receipts, and approvals

**Status:** Accepted

A sponsor pledge is not proof of payment, and a student submission is not verified until the staff workflow records approval. Public totals must identify which state they represent.

## 2026-08-01 — Require rule tests before live use

**Status:** Accepted

The current repository lacks automated Firestore-rule coverage. Real student or financial use is blocked until authorization, school scope, approval, and aggregate-integrity rules are tested.
