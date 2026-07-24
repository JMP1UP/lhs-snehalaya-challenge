# Application agent guidance

## Purpose

Describe the application purpose and the people it serves.

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
