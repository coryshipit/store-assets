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
- target store adapter for the task
- default locale
- current application version
- task: initialize

Only `microsoft-store` is executable in this version. Apple App Store and Google Play directories are reserved skeletons, not adapters. If the requested store is unsupported, explain that no rules or templates exist and make no store-content changes.

The Microsoft Store workflow manages updates only. Before initializing its rulebook or preparing a submission, verify that the application already has a published Microsoft Store listing and a current released version. For a first store submission, retain this work package in the project but use the store's official process outside Store Assets; do not create a submission record or release preparation here.

Then generates the rulebook (§3). No other store work happens before the rulebook exists.

### 1.2 Later tasks — rulebook already exists

1. This document (process).
2. The project rulebook (`<PRODUCT_NAME>-store-assets.md`) — structure and rules.
3. The file skeletons in the rulebook; they are the Phase 1 source for listing, release-notes, and submission-record formats.
4. Existing files under the selected store adapter's `current/`, `release-prep/`, and `submissions/` directories that the task touches.
5. Verifiable facts in the application project: PRD, release notes, QA results, and approved screenshots.

Then identifies:

- target store adapter and task type: prepare update, validate, record status, or promote published assets

When preparing an update, also identify its update type (§2.1), the confirmed released application version, and its locale/change scope before writing a candidate or record. Inspect both records and existing candidate content first (§4.2).

For Microsoft Store Logo work, read [asset-rules.md](microsoft-store/asset-rules.md) before selecting derivatives or upload fields. Confirm MSIX versus MSI/EXE, application versus game, and supported devices from project/store evidence. Use the adapter's inventory template to record sources, exports, language consumers and review gaps. Customer locales are independent of the Partner Center interface language.

Anything that cannot be determined safely is marked as pending confirmation, not filled in.

For a validation task or before handing off prepared/updated records, run the optional read-only checker when its runtime is available: `node scripts/check-store-assets.mjs --root .` from the kit directory. See [checking.md](checking.md) for requirements, output, and limits. Resolve errors or list them as explicit incomplete work; review findings are not automatically resolved by a zero exit code. If the runtime/check is unavailable, report that limitation and perform the applicable rulebook checks manually, without claiming an automated PASS.

## 2. Variable interface

The agent resolves project variables before generating the rulebook. For a submission, establish task identity, update type, confirmed released application version, and scope first; mark other unavailable facts as `Pending — <reason>` instead of inventing them. Templates keep placeholder names; generated files receive resolved values or the explicitly allowed pending/not-applicable values below. Do not do a blind repository-wide replacement; historical records and `current/` keep their values.

### Project variables (resolved once at initialization)

| Placeholder | Meaning |
|---|---|
| `{{PRODUCT_NAME}}` | product display name |
| `{{STORE_PLATFORM}}` | selected store adapter; currently `microsoft-store` only |
| `{{STORE_DISPLAY_NAME}}` | display name of the selected supported store; currently `Microsoft Store` |
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
| `{{SUBMISSION_ID}}` | repository record ID: `YYYY-MM-DD-task-name`, e.g. `2026-08-04-listing-refresh`; not a store-issued ID or proof of submission date |
| `{{SUBMISSION_DATE}}` | date of the latest actual submission attempt when known from its event; leave empty before submission or when that attempt's occurrence date is unknown |
| `{{UPDATE_TYPE}}` | `listing-only` or `package-update`; see §2.1 |
| `{{RELEASED_APPLICATION_VERSION}}` | currently published application version confirmed for this task; initialization facts may be stale |
| `{{APPLICATION_VERSION}}` | version this candidate describes: the released version for `listing-only`, the confirmed target version (or `Pending — <reason>`) for `package-update` |
| `{{NEW_PACKAGE_VERSION}}` | exact version of the new package from application-project evidence, `Pending — <reason>`, or `Not applicable` for `listing-only` |
| `{{PACKAGE_EVIDENCE}}` | references to application-project package/build/QA evidence, `Pending — <reason>`, or `Not applicable` for `listing-only` |
| `{{STORE_SUBMISSION_ID}}` | external ID only if reported by the store; otherwise `Pending — not reported by the store` |
| `{{LOCALES}}` | locales covered by the submission |
| `{{LOCALE}}` | locale of the file being generated |
| `{{STATUS}}` | current status (see the status machine below) |
| `{{DRAFT_CREATED_DATE}}` | date this repository Draft was created, when known; not a store event |
| `{{PUBLICATION_DATE}}` | platform publication date only when evidenced; may stay empty even when status is `Published` |
| `{{PUBLICATION_CONFIRMED_DATE}}` | date explicit user go-live confirmation was received; separate from the platform publication date |

Submission version values describe that submission only; they do not rewrite initialization facts or historical records. A pending value is a known gap, not a `{{...}}` token. If task identity, type, released version, or scope cannot be established, ask before writing candidate content or a new record; read-only investigation may continue. Other missing facts block only dependent work and readiness. Never use `Not applicable` to hide missing package-update evidence.

### 2.1 Update types and field applicability

These are Store Assets task labels, not Partner Center submission categories.

| Rule | `listing-only` | `package-update` |
|---|---|---|
| Scope | Store copy, screenshots, Logos, or other supported listing assets; no new application package | New application package, with or without listing/asset changes (a mixed update uses this type) |
| Released application version | Required, confirmed current version | Required, confirmed current version |
| Candidate application version | Same as the released version; never auto-increment | Actual target version from the application project; may remain pending during preparation |
| New package version | `Not applicable` | Exact package version from evidence; may remain pending during preparation |
| Package evidence | `Not applicable` — no new package in this task | References identifying the candidate package and its build/QA evidence; may remain pending during preparation |
| Independent record | Required, starts at `Draft` | Required, starts at `Draft` |

Package evidence should locate the actual artifact and applicable application-project checks, for example its filename, architecture, hash, build source, and QA report. Do not copy packages, signing material, or secrets into this kit, perform engineering checks on the strength of this document alone, or equate a reference with a passed check. Product and package version strings may differ; never derive one from the other or choose a new version on the application's behalf.

A listing-only update preserves unrelated listing fields and application release notes. Do not invent a new application release or add Logo changes to application release notes merely to fill a skeleton. Record asset changes in the submission record. Review and official submission still apply even when there is no new package.

Microsoft basis: [Publish update to your MSIX app on the Store](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/publish-update-to-your-app-on-store), checked 2026-10-22: metadata-only updates do not require a new package and still undergo certification. This source does not define Store Assets' internal labels, package evidence fields, or Logo specifications.

### 2.2 Historical evidence and time

The submission record is the source for its attempts and event history (rulebook §6). Keep that history in the same record; do not create a second status ledger.

- A **submission attempt** binds approved assets to a full Git commit object ID and repository-root-relative paths. An entry may be prepared before actual submission; only a sourced `submitted` event records a reported store submission. Attempt numbers are local identifiers, not store-issued IDs or counts of completed uploads.
- An **event** distinguishes occurrence time, observation time, and time written to the record, with a source. Missing external times remain `Unknown`. A filename date, filesystem timestamp, or Git commit time is not evidence of a store event.
- Record an explicit user report that the app is live as `go-live-confirmed`. This permits the existing Published/promotion flow, but does not supply a platform publication timestamp. Add a separate `platform-published` event only when that timestamp/date is supported.
- Date summaries at the top of the record derive from the corresponding events. `Publication date` can remain empty while `Publication confirmed date` is known. A `promoted` event records the local archive operation, not the platform's publication time.
- Preserve earlier attempts/events when adding later facts. Corrections identify the earlier entry, old/new values, reason, and source; never silently replace submitted asset history. Legacy records retain their original date values with an explicit interpretation note until evidence supports a correction.

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
Submitted
In certification
Action required
Rejected
Withdrawn
Published
```

Transitions:

```text
Draft → Submitted → In certification → Published
             │              │
             └─ Action required / Rejected → Draft
Withdrawn can be entered at any point.
```

Draft is the default for a new release preparation. The ready-for-submission checklist is the quality gate for a Draft; it does not create a separate status. The status is recorded in the submission record and presented to the user.

## 4.2 Prepare an update

The agent must not edit `current/`. Each store adapter permits only one active submission at a time (`Draft`, `Submitted`, `In certification`, or `Action required`). Inspect all records and actual `release-prep/` content before copying or writing. Empty directories and `.gitkeep` alone are not candidate content.

- **No active record and no leftover candidate:** begin a new update with the established identity/type/version/scope.
- **An existing active record:** if the task explicitly continues that submission, use the same record and candidate. Edit a Draft, or reopen fixes under §4.3; do not modify submitted/in-certification assets while merely tracking status. A different update must wait for the existing submission to be resolved or withdrawn; do not auto-withdraw it or create another record.
- **Multiple active records, conflicting scopes, or uncertain ownership:** report the conflict and preserve files; do not start or attach a candidate to a guessed record.
- **A Published record with uncompleted promotion:** finish or resolve that archive operation under §4.4 before starting another preparation. Keep Published; do not reopen it as Draft or repurpose its remaining candidate for a different update.
- **Candidate content without a matching active record:** use the recovery steps below. Historical `Rejected`/`Withdrawn` records do not authorize overwriting their remaining candidate content.

1. Create the independent `submissions/<submission-id>.md` record with `Draft`, task variables, affected locales, intended changes, candidate paths, and known open items. Add a sourced `draft-created` event for this local operation and its known creation date. Do not overwrite an existing record ID or invent earlier candidate/store event times. Candidate preparation and this record form one deliverable.
2. Create `release-prep/<locale>/` for each affected locale as a complete future snapshot, copying `current/<locale>/` first when it exists. Preserve unchanged assets and release notes; document intended additions and removals. Do not replace an existing candidate to resume it.
   For Logo work, carry its inventory and owned files; if shared assets change or supply a candidate source, also copy the complete `current/shared/` baseline to `release-prep/shared/`. Rebase only the copied inventory's source/export paths to `release-prep/`. Preserve unchanged shared consumers, record every consumer of changed shared exports in Locales, and explicitly reference the complete shared tree in Submitted files. Missing baseline/source/role facts stay open items. See [the Logo example](examples/logo-assets.md).
3. Update only the files inside the preparation, applying §2.1. Keep the record's scope, file references, and open items aligned with the candidate. If work stops early, retain the Draft and describe missing/incomplete files; do not call an incomplete candidate ready.
4. Before handoff, check both the candidate and its record using the rulebook checklist. Report the ID, update type, version applicability, changed paths, preserved `current/`, and any readiness gaps. A new candidate without its independent Draft is incomplete, even if its images are ready.

### Recover a candidate with a missing or inactive record

1. Inspect the candidate, records, Git history, and confirmed project facts without changing assets. Report the missing association and any conflicts; do not infer ownership from a locale, filename, or modification time alone.
2. If evidence and the requested task establish that it belongs to an existing submission, resume that record. Reopen a rejected submission as Draft only when preparing its confirmed fixes (§4.3). Do not reopen a withdrawn/published submission or link a new change to it merely to avoid creating a record.
3. If the confirmed task is a separate update and no other active submission conflicts, create its independent Draft using the current agreed ID/type/released version/scope. Keep unknown historical facts unknown; the new record must not claim when earlier candidate work or a store submission occurred.
4. If ownership or required task facts remain uncertain, ask for those facts and stop dependent edits. Keep all existing content; do not delete or recopy it from `current/` as a repair. Read-only checks and reporting can continue.
5. Reconcile known candidate files with the recovered record, explicitly list missing or unreviewed items, then run the same handoff checks. Association alone does not prove candidate completeness or user approval.

## 4.3 Submit and track

### Freeze approved assets before submission

1. Present the candidate and known gaps for review. After its content is approved, identify the complete affected candidate trees and approved additions/removals. Freeze the actual approved content, not an earlier convenient revision.
2. Use the application's Git repository and its normal commit rules to commit those assets, or identify an existing commit that contains exactly that content. Stage only the intended scope; do not commit unrelated user work, initialize a repository, or push merely to obtain a snapshot. If a commit cannot be made, keep preparing independently and report the snapshot as pending.
3. Resolve that revision to its full commit object ID. Record every snapshot path relative to the application Git root, for example `store-assets/microsoft-store/release-prep/en-US`. Use literal paths, not absolute local paths, `..`, a moving branch/tag name, `HEAD`, or an abbreviated ID as the durable reference. Include all affected locales and supported shared assets; a snapshot of one changed image alone does not capture the complete candidate.
4. Verify that the commit and path contents exist, all intended files are stored, and the candidate being handed off matches that committed content. Check staged/unstaged changes and untracked/ignored files within the scope; a commit ID alone does not capture them. Resolve any LFS/submodule/external asset content separately, or report that limitation as pending. Git text normalization is distinct from the upload bytes of a binary asset.
5. Add an attempt entry with the snapshot reference, approval source, and verification result/time. The assets commit can precede the record update and need not contain that record; never require a future self-referencing commit ID. Keep each referenced revision reachable in retained project history, and preserve it when squashing, rebasing, or pruning history. Recheck availability whenever the snapshot is used.

An unfinished Draft has no need for a frozen attempt yet. Before presenting a new submission as ready, the approved snapshot must be verified and the other checklist items satisfied. Approval/snapshot preparation alone does not change status to Submitted.

For a normal checkout, read-only verification can use `git rev-parse --verify --end-of-options "<revision>^{commit}"`, inspection of stored path contents, `git --literal-pathspecs diff --exit-code <full-commit-id> -- <path>`, and `git --literal-pathspecs status --porcelain=v1 --untracked-files=all --ignored -- <path>`, run from the repository root with arguments quoted for the shell. Review every result; an empty diff is insufficient if intended files are untracked, ignored, or unavailable. These are manual checks, not an implemented Store Assets validator. Command basis, checked 2026-10-23: [rev-parse](https://git-scm.com/docs/git-rev-parse), [diff](https://git-scm.com/docs/git-diff), [status](https://git-scm.com/docs/git-status).

### Record external events and resubmissions

1. After the user reports actual submission through official tooling, add a sourced `submitted` event tied to the exact approved attempt and set `Submitted`. Update `Submission date` only from the event's known occurrence date. If the user reports submission later without its actual time/date, occurrence stays Unknown while observation/recording times are recorded.
2. Record store progress as `status-observed` events and update `In certification`, `Action required`, or `Rejected` from the supplied evidence. Do not infer intermediate states or precise times that were not reported.
3. On confirmed review fixes, reopen the same record as `Draft`, add a sourced local `draft-reopened` event, and edit the candidate. Preserve the earlier submitted attempt and its assets reference. New approved content gets a new numbered attempt and snapshot; a later actual submission gets another `submitted` event. Even if content is unchanged, a new reported submission gets a distinct attempt/event (the same commit may be reused if verified).
4. If the store action already happened but its snapshot cannot be established, record the true reported status/event and a pending snapshot gap. Never fabricate an old commit, bind unrelated current content to an earlier attempt, or refuse to record an external fact just because local evidence is incomplete. Backfill only from evidence of what was actually submitted, with the later recording time explicit.

If Git is unavailable, the directory is outside Git, or a shallow/partial checkout lacks required objects, preserve the supplied reference and mark verification pending with the cause. Do not substitute today's HEAD or initialize/fetch/rewrite history silently. A shallow checkout is acceptable when the required commit and all asset contents are actually available.

## 4.4 Promote published assets

Only after the user explicitly confirms the app is live:

1. Record the sourced `go-live-confirmed` event, its receipt date as `Publication confirmed date`, and `Published`. Leave `Publication date` empty unless the platform occurrence date is separately evidenced. Associate confirmation with the correct attempt; if that association is uncertain, record the gap without guessing.
2. Reverify that attempt's immutable snapshot. Confirm the complete approved `release-prep/<locale>/` content still matches it, or deliberately recover the exact stored snapshot into an isolated staging directory for inspection. Never promote later edits or an unavailable snapshot on the strength of a moving `current/` link.
3. Replace each affected `current/<locale>/` tree with that complete approved snapshot, so removed files do not remain as live assets. Keep the attempt's original commit/path references unchanged even though those paths may no longer exist in today's working tree.
   Include the complete approved `shared/` scope when present. Rebase inventory `source`/`export` paths from the candidate state to `current/` in the promoted working copy; this path-only change preserves approved source/export bytes. Retain the committed inventory and original attempt references. Deleting a local export does not prove the remote field was cleared; record actual upload/removal/live observations with evidence.
4. After verifying the replacement, add a local `promoted` event identifying the attempt and remove only the completed preparation. If verification or replacement cannot finish, keep the known Published status, candidate files, and an explicit uncompleted-promotion item; do not add a promoted event or delete the candidate. A later task can finish this archive operation without reopening the submission as Draft.
5. Report which assets are archived and whether the live store page was actually observed. User confirmation permits promotion; it does not prove an independent live-page comparison. Preserve any unverified page result.

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
3. Determines task identity, type, confirmed released version, and scope; asks for missing prerequisites and records other unknowns as pending without inventing them.
4. If initializing, generates the rulebook from `templates/store-rulebook.md.template` (§3).
5. Creates the standard structure or updates the correct directories.
6. Generates or updates the relevant files (from templates where applicable); preparation includes its independent Draft and a complete candidate, or an explicit incomplete-work report.
7. Reports: record ID/update type/version applicability, created/modified/unmodified paths, gaps, unresolved placeholders, and claims needing review. No new candidate is handed off without its Draft.
