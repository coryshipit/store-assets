# Store Assets Roadmap

## Role

`ROADMAP.md` records the overall direction of Store Assets and the progress of development tasks.

It answers "where is this project going, and what is done so far." Task-level acceptance criteria and implementation details live in the corresponding spec or design docs, not here.

## Current phase

Phase 1 — Specification: finalize the starter-kit design, implement the Microsoft Store workflow, and ship a copyable starter kit.

The target shape: a user copies `starter-kit/` into an application project as `store-assets/`, the agent starts the workflow by reading `store-assets-workflow.md`, and the workflow generates the per-product rules document from the template. The package README is a static overview and is not generated.

## Product principles

These principles shape the roadmap and every task on it.

1. **Complement, not replace.** Store Assets is a publishing-preparation layer. It does not compete with existing store tooling, so it should point users to those tools instead.
2. **Open values in the README.** The root `README.md` should recommend other well-suited tools already on the market and help users execute their task well. The right response to a store-tooling question is "here are options, choose what fits you", not "use only what we ship."
3. **Agent-readable by design.** The whole workflow must be executable by an agent in a fresh session from repository files alone.
4. **No invented facts.** Recommendations must be verifiable before being published, and product claims in templates/examples must be defensible.

## Recording: placeholder mechanism decisions (2026-08-08)

These were confirmed in discussion and are recorded here so they are durable, not hidden in conversation.

### Two placeholder-filling mechanisms

Users get **two interchangeable ways to resolve placeholders** (they may choose one per task):

1. **Conversational filling (primary, Phase 1):** the agent reads the workflow spec, asks the user for the concrete placeholder values in conversation (product name, locales, app version, ...), and fills them as it generates. Natural for agent-assisted project work.
2. **`variables.yaml` centralized replacement (next version):** a YAML input interface where the user fills project/submission variables once, and a script resolves placeholder tokens across the workspace. Deferred because the conversational path is the first-class interaction for this phase.

Both paths fill the **same** placeholder set; they differ only in how values are collected.

### Naming: the placeholder source is a template, files with no placeholders ship static

- The document that carries `{{...}}` placeholders and serves as the **master source** must be named as a template (consistent with the existing `.template.md` convention), not as a final document.
- The **resolved output** of the mechanism is the formal project document (for example the user's `store-assets/<PRODUCT_NAME>-store-assets.md`).
- Documents that do not need project values ship **static** and are never generated (the package `README.md`). Store Assets should thus distinguish: placeholder-bearing **template**, generated **product document**, and **static** package files; a document named `README.md` must not be shipped with unresolved placeholders to the user's project.

### Bootstrap document (decided 2026-08-08)

- A dedicated **bootstrap document** starts the whole workflow. The agent reads it first; it defines the file structure, the rules of each directory, the variable interface, and how the rulebook and working files are generated.
- Its file name is **`store-assets-workflow.md`** (lowercase kebab, following the repository naming convention). It is deliberately not named `AGENTS.md` to avoid colliding with the `AGENTS.md` that virtually every AI coding project already places at its own repository root.
- The package ships a **static `README.md`** (overview, no placeholders, not generated). The rules template lives at package level under `templates/` (`templates/store-rulebook.md.template`) and is resolved by the bootstrap workflow into the user's `<PRODUCT_NAME>-store-assets.md`; store-specific record templates will live under `microsoft-store/templates/`. All template directories are kept in this phase.

### Automatic bootstrap injection (decided 2026-08-08)

- **Phase 1 keeps the current interaction:** the user explicitly asks, and the agent reads the bootstrap document on its own. No automatic injection is implemented yet.
- **Future direction (tentative, design not final):** make the bootstrap document load automatically on every agent session, for example by:
  - injecting the bootstrap content into the repository's agent instructions file (such as `AGENTS.md`), or
  - tool-config injection (see opencode `instructions`), or
  - a future MCP server or plugin.
- These are recorded as later-phase considerations; they are not scheduled in Phase 1.

## Finalized starter-kit design (2026-08-08)

Consolidated from the discussion above. This is the agreed Phase 1 target for `starter-kit/`; further changes require a new decision.

**Refinement (2026-08-08):** templates are split by ownership — package-level `templates/` holds document templates; store-specific record templates will live under `microsoft-store/templates/` in a later phase.

**Refinement (2026-08-08):** the kit splits process from rules. `store-assets-workflow.md` is a pure process spec (no human-facing intro, no hard-coded values). The package `README.md` is a static overview (no placeholders, not generated). The rules live in `templates/store-rulebook.md.template`, which is generated per product as `<PRODUCT_NAME>-store-assets.md` with the variable interface resolved.

**Refinement (2026-08-09):** the entry points split by phase. Initialization is the first task: the agent reads the workflow and the rulebook template, confirms project variables with the user, and generates the rulebook — no store work happens before it exists. Later tasks read the existing rulebook instead (workflow §1.1 / §1.2).

**Refinement (2026-08-09):** the release package changes shipped name. The zip's top-level folder is `store-assets/` (the repository's `starter-kit/` renamed at package time), so a download needs no renaming step. See `docs/DISTRIBUTION.md`; the packaging mechanism itself is still Task B.

**Refinement (2026-08-09):** the rulebook file name derivation is fixed. `{{RULEBOOK_FILE}}` derives from `{{PRODUCT_NAME}}` by: lowercase; replace separators (space, `_`, `.`, `/`) with `-`; no hyphen inserted at digit or camelCase boundaries; keep existing hyphens; collapse repeated hyphens and trim edges; append `-store-assets.md`. Definition lives in `store-assets-workflow.md` §2.

### 1. Starter-kit directory (after copying into the user project as `store-assets/`)

```text
store-assets/
├── store-assets-workflow.md          # Bootstrap/process doc: how an agent runs the workflow (no product values)
├── README.md                         # Static package overview (no placeholders, not generated)
├── <PRODUCT_NAME>-store-assets.md    # Generated rules doc (from templates/store-rulebook.md.template)
├── templates/                        # Package-level template sources
│   └── store-rulebook.md.template    # Placeholder source; resolved into the per-product rules doc
├── apple-app-store/                  # Reserved skeleton (future phase; no rules assumed)
├── google-play/                      # Reserved skeleton (future phase; no rules assumed)
└── microsoft-store/
    ├── current/                      # Live, published state
    │   └── <locale>/                 #   e.g. en-US/
    │       ├── listing.md
    │       ├── release-notes.md
    │       └── screenshots/
    │           ├── source/
    │           └── export/
    ├── release-prep/                 # Draft area, organized per locale (no submission-ID subdirs)
    │   └── <locale>/                 #   mirrors current/<locale>/ so publish is a whole-tree move
    │       ├── listing.md
    │       ├── release-notes.md
    │       └── screenshots/
    │           ├── source/
    │           └── export/
    ├── submissions/                  # One file per submission
    │   └── <submission-id>.md        #   e.g. 2026-08-04-listing-refresh.md
    └── templates/                    # Store-specific record template sources (reserved, later phase)
```

### 2. Document roles and naming

- **`store-assets-workflow.md` (process spec)**: a pure workflow document — lifecycle, status machine, submission steps, and the variable interface. It carries **no product values and no placeholder-bearing rules**; it is deliberately not named `AGENTS.md` (avoids colliding with project-root `AGENTS.md`) and not named `README`.
- **`README.md` (static package overview)**: describes what the package is and how to start. It ships as-is, contains **no placeholders**, and is **not** generated from a template.
- **`templates/store-rulebook.md.template`**: the placeholder-bearing rules source (`{{...}}` + `template_version`), resolved per product into `<PRODUCT_NAME>-store-assets.md` (e.g. `my-app-store-assets.md`). It holds structure, directory responsibilities, naming, file contents, accuracy/security rules, and the ready checklist.
- **Store-specific record templates** (listing, release notes, submission records): live under `microsoft-store/templates/`, deferred to a later phase alongside `variables.yaml`.
- Generated output follows the **`.template.md` → `.md`** convention: the placeholder source is the template; the readable document never ships with unresolved placeholders.
- Generated output follows the **`.template.md` → `.md`** convention: the placeholder source is the template; the readable document never ships with unresolved placeholders.

### 3. Two placeholder mechanisms

| Mechanism | Timing | Status |
| --- | --- | --- |
| Conversational filling (agent asks, user answers) | Phase 1 primary | Implemented now |
| `variables.yaml` centralized replacement (script resolves tokens) | Next version | Reserved |

### 4. Submission records and status machine

- The submission record lives at **`submissions/<submission-id>.md`**, named after the submission ID (`YYYY-MM-DD-task-name`).
- A `status` field tracks the whole release flow across every stage (enum is illustrative, not exhaustive):
  `Draft → Ready for submission → Submitted → In certification → [Action required] → Published`
  With branches: `Withdrawn` (withdraw at any point), `Rejected` (returned for fixes).
- Status transitions must still be written back to the bootstrap/spec docs; `current/` must not be updated until the user confirms the app went live.

### 5. Release flow

```text
finish copy + screenshots in release-prep/<locale>/
        ↓ release preparation
submit a submission to the store
        ↓ user confirms it is live
move materials to current/<locale>/
        ↓
record the submission in submissions/ (status = Published)
```

- `release-prep/` holds only per-locale drafts, no submission records.
- `current/` represents the live state; preparation must not modify it directly — only update after a publish confirmation.

## Task progress

| ID | Task | Status | Notes |
| --- | --- | --- | --- |
| A | Complete Microsoft Store templates and specification | done | workflow (process) + rulebook template + static README implemented in `starter-kit/`; record templates deferred to the variables.yaml version |
| B | Establish the starter-kit release mechanism | pending | packaging contract finalized in `docs/DISTRIBUTION.md` (zip top-level folder `store-assets/`); mechanism itself (packaging + tag-triggered GitHub Actions) not implemented yet |
| C | Convert documentation to English | done | all docs now English, including the root `README.md` (translated 2026-08-09) |
| D | Add tool recommendations to the root README | pending | recommend complementary ecosystem tools so users pick what fits their target store |
| E | Finalize the starter-kit structure under the two mechanisms | done | structure implemented in `starter-kit/` per the "Finalized starter-kit design" section |
| F | Establish a QA procedure for the starter kit | done | `docs/QA.md` defines conformance + dry-run checks; staged dry-run mode adopted (2026-08-08) after three full-run attempts ended in headless-agent silence — judged by files, not by the agent's final message; dry-run fixture project exists but no full pass recorded yet |
| G | Research and optimize the testing approach | pending | the staged dry-run is an interim method; the overall testing approach needs further research — dry-run may not be the optimal solution (recorded 2026-08-08) |

### Task D detail

**Why:** `reference/PROJECT-CONTEXT.zh-CN.md` §16 and §15 position Store Assets as complementary and differentiated from existing publishing tooling; the repo README should follow Principle 1 (complement, not replace) by pointing users to otherwise better-suited tools.

**What:** Add a section to the root `README.md` that recommends tools with an advantage for a given job.

**Expected content (verify before publishing):**
- helper apps and tooling for the Apple ecosystem and other platform workflows the user may request (for example preferred app publishing, preview, or review side tools)
- a clear note that these are third-party recommendations, and that Store Assets remains the Git-native preparation layer
- no speculation, no unverified claims, and no lock-in to a single store

**Acceptance:**
- The section is added and directly visible under "documentation" or a dedicated "reference tools" area
- Users can choose the tool that fits their workflow, not forced into Store-only tooling
- Linked from the README, and the recommendation context is preserved when an agent starts reading it

**Status:** proposed — the concrete tool list is to be confirmed with the maintainer before writing it

## Priority

1. Complete the Microsoft Store templates and specification (Task A)
2. Establish the release mechanism and publish the first artifact (Task B)
3. Keep lifecycle, naming, and terminology consistent across `README.md`, `starter-kit/`, templates, and examples
4. Add the tool recommendations section to the root `README.md` (Task D)

## Next steps

- Run the QA procedure from `docs/QA.md` on the current kit in **staged mode** (one phase per fresh session, files-only acceptance) and record the result.
- Research the testing approach (Task G): decide whether dry-run stays, is replaced, or is supplemented — the current method is not yet considered optimal.
- Clarify and accept the concrete list for Task D with verifiable sources before writing it into `README.md`.
- Reopen Task B with a packaging upload workflow (tag-triggered GitHub Actions that produces the plain zip; top-level folder `store-assets/` per `docs/DISTRIBUTION.md`).
- Track new tasks as they are added to this doc (validation script, CLI, multi-store adapters).

## Future phases (at a glance)

These are direction, not plans; each future store keeps the same high-level lifecycle.

- **Phase 2 — Validation:** a `store-assets init`, `store-assets validate`.
- **Phase 3 — Release workflow:** begin/submit/publish commands.
- **Phase 4 — Multi-store adapters:** `apple-app-store/`, `google-play/` schemas.
- **Phase 5 — Publishing integrations:** official APIs, CLIs, CI/CD.

These phases are not implementation plans until the spec, templates, and examples for the current phase are stable.