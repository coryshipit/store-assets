# Store Assets Workflow

This document defines how an agent executes store-related tasks in this repository. It is the process specification.

For package context (what this is, how to start) see the static `README.md`. For structure, naming, and validation rules see the project rulebook `<PRODUCT_NAME>-store-assets.md`, generated from `templates/store-rulebook.md.template`. Rules live there, process lives here.

---

## 1. Before starting, the agent reads

There are two entry points, and they read different files: **first setup (initialization)** has no rulebook yet; **later tasks** do.

### 1.1 Initialization — the first entry (no rulebook exists yet)

1. This document (process).
2. `templates/store-rulebook.md.template` — the source of structure and rules until the rulebook exists.
3. Verifiable facts in the application project: PRD, release notes, QA results, and approved screenshots.

Then identifies:

- product name
- target store
- default locale
- current application version
- task: initialize

Then generates the rulebook (§3). No other store work happens before the rulebook exists.

### 1.2 Later tasks — rulebook already exists

1. This document (process).
2. The project rulebook (`<PRODUCT_NAME>-store-assets.md`) — structure and rules.
3. The relevant template under `templates/`.
4. Existing files under `current/`, `release-prep/`, and `submissions/` that the task touches.
5. Verifiable facts in the application project: PRD, release notes, QA results, and approved screenshots.

Then identifies:

- task type: prepare update, validate, record status, or promote published assets

Anything that cannot be determined safely is marked as pending confirmation, not filled in.

## 2. Variable interface

The agent resolves variables before generating files. Templates keep placeholder names; generated files receive resolved values. Do not do a blind repository-wide replacement; historical records and `current/` keep their values.

### Project variables (resolved once at initialization)

| Placeholder | Meaning |
|---|---|
| `{{PRODUCT_NAME}}` | product display name |
| `{{STORE_PLATFORM}}` | `microsoft-store` |
| `{{STORE_DISPLAY_NAME}}` | `Microsoft Store` |
| `{{DEFAULT_LOCALE}}` | default locale, e.g. `en-US` |
| `{{CURRENT_APP_VERSION}}` | version of the app currently released |

Derived value:

| Placeholder | Meaning |
|---|---|
| `{{RULEBOOK_FILE}}` | file name of the generated rulebook: `<PRODUCT_NAME>` lowercased and normalized to file-safe kebab-case plus `-store-assets.md`, e.g. `my-app-store-assets.md` |

Derivation of `{{RULEBOOK_FILE}}` from `{{PRODUCT_NAME}}`:

1. Convert to all lowercase (`My App` → `my app`, `App2Go` → `app2go`).
2. Replace separators (space, `_`, `.`, `/`) with `-` (`my_app` → `my-app`).
3. Never insert `-` between letters and digits, and never insert `-` at camel-case boundaries (`MyApp` stays `myapp`, `App2Go` stays `app2go`).
4. Keep existing hyphens as-is (`X-Wing` → `x-wing`).
5. Collapse repeated `-` into one, and trim leading/trailing `-`.
6. Append `-store-assets.md`.

Examples: `My App` → `my-app-store-assets.md`; `MyApp` → `myapp-store-assets.md`; `App2Go` → `app2go-store-assets.md`; `X-Wing` → `x-wing-store-assets.md`.

### Submission variables (resolved once per release preparation)

| Placeholder | Meaning |
|---|---|
| `{{SUBMISSION_ID}}` | `YYYY-MM-DD-task-name`, e.g. `2026-08-04-listing-refresh` |
| `{{SUBMISSION_DATE}}` | date in `YYYY-MM-DD` |
| `{{UPDATE_TYPE}}` | e.g. `new version`, `listing refresh` |
| `{{APPLICATION_VERSION}}` | application version of this submission |
| `{{LOCALES}}` | locales covered by the submission |
| `{{LOCALE}}` | locale of the file being generated |
| `{{STATUS}}` | current status (see the status machine below) |
| `{{PUBLICATION_DATE}}` | stays empty until publication is confirmed |

When a submission has its own version, it overrides the project variable for that submission. If a required value cannot be inferred, ask the user before generating files.

### Template version

Templates carry a `template_version` marker. When a template changes, its version is bumped. A generated document records the template and template version it was produced from, so a later session can detect drift.

`{{TEMPLATE_VERSION}}` resolves to the `template_version` value of the template being generated from.

## 3. Generate the project documents

On initialization (§1.1), the agent generates exactly one project document — the rulebook — and this generation **is** the first store work. Later tasks read the existing rulebook instead (§1.2). The generated document:

| Template | Generated file |
|---|---|
| `templates/store-rulebook.md.template` | `<PRODUCT_NAME>-store-assets.md` (rulebook, i.e. `{{RULEBOOK_FILE}}`) |

`README.md` is a static guide shipped with the package; it is **not** generated and carries no placeholders.

Steps:

1. Read the template.
2. Resolve every `{{...}}` placeholder using the variables above.
3. Write the result to the target path.
4. A generated document must never ship with unresolved placeholders, **except** per-submission tokens (`{{LOCALE}}`, `{{SUBMISSION_ID}}`, `{{APPLICATION_VERSION}}`, `{{PUBLICATION_DATE}}`, `{{STATUS}}`) that appear inside the rulebook's **examples and file skeletons** — the rulebook declares these as intentional literal placeholders (see rulebook §1). Examples are illustrations of file shape, not values to resolve.

Per-submission parameters have no value until a submission begins, so the rulebook carries them only in example form.

---

## 4. Submission lifecycle

## 4.1 Status machine

Allowed statuses:

```text
Draft
Ready for submission
Submitted
In certification
Action required
Rejected
Withdrawn
Published
```

Transitions:

```text
Draft → Ready for submission → Submitted → In certification → Published
        │                          │
        └────────── Action required / Rejected ──────────────┘
                      fixes return to Draft
Withdrawn can be entered at any point.
```

Draft is the default for a new release preparation. The status is recorded in the submission record and presented to the user.

## 4.2 Prepare an update

The agent must not edit `current/`.

1. Create `release-prep/<locale>/` for each affected locale, copying the current structure when useful.
2. Update only the files inside the release preparation.
3. Record the submission variables and status (starting at `Draft`) in the new submission record.
4. Validate using the ready-for-submission checklist in the rulebook before presenting the draft.

## 4.3 Submit and track

1. Present the validated draft to the user.
2. After the user submits through the official tooling, set the status to `Submitted`.
3. When the store reports progress, update to `In certification`, `Action required`, or `Rejected` as appropriate.
4. On `Action required` or `Rejected`, fix the draft in `release-prep/` and reopen as `Draft`.

## 4.4 Promote published assets

Only after the user explicitly confirms the app is live:

1. Copy the approved materials from `release-prep/<locale>/` into `current/<locale>/`.
2. Record `status: Published` and the publication date in the submission record.
3. Archive or clean up the completed `release-prep/` content per the user's convention.
4. Confirm the repository assets match the live store page.

The agent must not set `Published` or update `current/` without that explicit confirmation.

Lifecycle overview:

```text
current → release-prep → submission → published → current
```

---

## Agent execution summary

When asked to initialize or perform store work, the agent:

1. Reads this document, then either the rulebook (§1.2) or, on first setup, the rule template (§1.1).
2. Inspects the application project.
3. Determines the required variables, asking for anything that cannot be inferred.
4. If initializing, generates the rulebook from `templates/store-rulebook.md.template` (§3).
5. Creates the standard structure or updates the correct directories.
6. Generates or updates the relevant files (from templates where applicable).
7. Reports: created/modified/unmodified paths, gaps, unresolved placeholders, and claims needing review.