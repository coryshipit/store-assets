# Store Assets Repository Agent Guide

This document governs the AI coding agent that develops **this Store Assets repository**.

It is not a product description for end users, and it is not the manual users follow when applying Store Assets inside their app projects. User-facing content lives in the root `README.md`; the copyable working package that users download and drop into their projects lives in `starter-kit/`.

## 1. Scope of work

The repository currently maintains:

- a publishing workflow specification (store-agnostic core with per-store rules and adapters)
- a repository convention
- reusable templates
- agent instructions
- a QA dry-run procedure for the starter kit

The workflow itself is not limited to one store — Microsoft Store is simply the first store for which rules are fully researched and implemented. Do not expand into GUI, SaaS, automated publishing, complex CLI, CI services, or Apple / Google rules without an explicit task and a stable specification.

## 2. Required reading

Before starting work, read as needed:

1. This file
2. `README.md`
3. `docs/MISSION.md` for the project's mission, and `docs/ROADMAP.md` for task progress
4. `docs/DISTRIBUTION.md` when working on the release artifact, and `docs/QA.md` when verifying the starter kit
5. `starter-kit/` files that users will actually copy and use

Do not read `reference/` as part of required reading. It holds development-time background material only; read it on demand when the user points you to it.

Priority order:

- The user's explicit instruction comes first
- This file constrains how the agent develops this repository
- User-facing usage follows `README.md` and `starter-kit/store-assets-workflow.md`
- Specific store rules must come from a recorded specification or verifiable sources

Do not treat historical conversation or hidden context as project facts. Important decisions must land in repository files.

### `reference/` is read-only

The `reference/` directory stores the user's protected background and decisions. Agents must never create, edit, rename, translate, or delete anything inside it. If a task seems to require changing `reference/`, stop and treat it as a user decision to propose, never execute on the agent's own initiative. This rule does not require asking first — it requires not modifying it at all.

## 3. Document responsibility boundaries

| File or directory | Responsibility | Should NOT contain |
| --- | --- | --- |
| `AGENTS.md` | Behavior constraints for agents developing this repo | User-facing tutorials, marketing copy |
| `README.md` | Project introduction, value, quick start, doc navigation | Fine-grained agent execution rules |
| `reference/` | Confirmed background, decisions, and scope. **Read-only for agents.** Never edit, rename, translate, or delete files here; this content belongs to the user | Temporary task state |
| `docs/MISSION.md` | The project's mission statement | Task tracking, user manuals, roadmap |
| `docs/ROADMAP.md` | Overall direction and task progress tracking | Detailed implementation steps |
| `docs/QA.md` | The starter-kit QA procedure (conformance + dry-run) | Per-task test logs; user tutorials |
| `docs/DISTRIBUTION.md` | Design of the standalone distribution of `starter-kit/` | User manuals, editorial decisions |
| `starter-kit/` | The actual work package users download and copy | The repo's internal development process |

If content explains "how a user uses Store Assets," it belongs in `README.md` or the user-facing kit documents (`starter-kit/store-assets-workflow.md` and templates); if it constrains "how an agent develops this repo," it belongs here.

## 4. Working on the repository

The agent should:

1. Check existing files and related tasks first; never assume the repo already has a complete implementation
2. Identify whether the change is spec, template, example, user documentation, or tooling
3. Prefer minimal, verifiable changes
4. Keep `README.md`, `starter-kit/`, templates, and examples in a shared vocabulary
5. Not invent Microsoft Store rules or product capabilities
6. After changing behavioral rules, verify the user work package still works standalone
7. On delivery, note which paths changed and what is not yet implemented

When developing tooling, also consider:

- whether input and output are clear
- whether write scope is predictable
- whether user content would be overwritten
- whether an agent in a fresh session can continue from repository files alone
- whether there are Microsoft Store examples or fixtures to verify behavior

### Usage-feedback iteration branches

For each iteration driven by real usage feedback, create a dedicated branch from `main` using:

```text
iteration/<case-name>-feedback
```

- Use the application or usage case name in lowercase kebab-case, for example `iteration/dirpilot-feedback`.
- For another iteration on the same case, append the date: `iteration/dirpilot-feedback-2026-10-22` (`YYYY-MM-DD`).
- Group the selected improvements and their verification on this branch for review before merging into `main`. The branch identifies the feedback source; it does not imply acceptance of every suggestion in that feedback.

## 5. Stable product boundary

Store Assets' core is:

```text
common publishing lifecycle
        +
repository convention
        +
store-specific rules and adapters
```

Do not compress different stores into one universal metadata schema. The workflow's common lifecycle applies across stores; each store keeps its own schema, required fields, asset requirements, validation rules, and adapters. Microsoft Store is currently the only store with fully researched and implemented rules; Apple App Store and Google Play remain reserved skeletons until real research and a stable specification exist.

The recommended automation evolution order is:

```text
documented workflow
  → templates
  → repeated agent execution
  → stable conventions
  → initialization script
  → validation script
  → CLI / CI / API integrations
```

Only add automation after the spec, templates, and examples are stable.

## 6. Completion criteria

Tasks that create a new spec, template, or tool should at least meet:

- Users can find the purpose and how to start in the README
- The agent can find relevant behavior constraints in the corresponding agent docs
- Real usage content lives in `starter-kit/` or examples, not only in developer notes
- Input, output, modification scope, and failure states are clear
- Validation never invents facts, deletes user content, or silently overwrites files
- Docs, templates, examples, and implementation share consistent lifecycle terms

## 7. Current repository priorities

1. Establish the QA procedure for the starter kit (`docs/QA.md`): conformance checking and staged dry-run; judge dry-run results by produced files, not by the agent's final message
2. Research and optimize the overall testing approach — the current dry-run method is interim and may not be optimal (see `docs/ROADMAP.md` Task G)
3. Keep lifecycle, naming, and terminology consistent across `README.md`, `starter-kit/`, templates, and examples
4. Track concrete development tasks in `docs/ROADMAP.md`
5. Complete the Microsoft Store specifications, templates, and examples
6. Only after the above, evaluate validation, CLI, and publishing integrations
