# Application agent guidance

## Purpose

The LHS Snehalaya Challenge app supports student fundraising, house participation, sponsor pledges, and cultural partnership updates. Safeguard student identities, distinguish pledges from received funds, and require staff verification where the product claims approval.

## Non-negotiable product rules

- Protect user trust, privacy, accessibility, and data integrity.
- Preserve established product behaviour unless the task explicitly changes it.

## Working practices

- Inspect existing code, tests, documentation, and framework conventions before changing anything.
- Do not make unrelated changes.
- Keep commits focused and reviewable.
- Update tests and documentation alongside code.
- Never expose, log, document, or commit secrets.
- Ask before destructive architectural changes, migrations, or irreversible data operations.

## Coding and design standards

- Follow the repository's existing language, linting, formatting, and naming conventions.
- Prefer simple, maintainable implementations with clear boundaries.
- Design responsive, accessible interfaces with keyboard support and appropriate semantics.

## Testing and security

- Run the relevant lint, test, type-check, and build commands before completion.
- Validate authentication, authorization, input handling, and failure paths.
- Use least privilege and treat personal, school, family, and wellbeing data as sensitive.

## Documentation

- Keep README, architecture, design, decisions, roadmap, release notes, and operational guidance current.

## Current operating context

This project is currently operated by a sole developer. John Partridge is the sole developer and final decision-maker.

John may hold product, technical, deployment, configuration, backup and restore, rollback, testing, monitoring, and final go/no-go responsibilities. Do not create separate responsibility structures or approval committees unless explicitly requested or justified by the project's current scale and risk.

For internal testing, use one concise operational checklist, identify genuine blockers, avoid re-auditing completed checks, and do not reopen settled decisions without new evidence. When the remaining work requires human access or judgement, stop generating reviews, state what remains unverified, and give the next concrete action.

## Proportional release and review

Classify each release as internal development, controlled internal pilot, external pilot, or production release, and apply controls proportionately.

For a controlled internal pilot, verify the environment, current and rollback versions, a restorable backup where live data is at risk, intended users and permissions, disabled dangerous functions, the core workflow with fictional data, and reconciliation of resulting data changes.

Retain strong safety checks and clear evidence for destructive or irreversible work, live data, authentication, email, migrations, and deployment. Do not mark incomplete checks as passed.

The standard high-risk sequence is implementation, one independent review, correction of confirmed issues, one verification review, human operational action, and a final go/no-go check. Add another review only for new code, an incomplete correction, contradictory deployment evidence, or a material new risk.
