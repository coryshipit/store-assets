# Store Assets QA

This document defines how the Store Assets `starter-kit/` is quality-checked.

It is a technical document for the repository itself. It is not user-facing usage instructions.

## What is tested

The starter kit is a spec plus templates plus agent instructions, not a program. There are no unit tests. QA checks two invariants instead:

1. **Conformance** — the files always obey the rules defined in the kit's templates (`templates/store-rulebook.md.template`) and the process spec (`starter-kit/store-assets-workflow.md`): structure, naming, placeholder discipline, and prohibited content.
2. **Behavior** — a fresh agent session given only the copied kit can run the workflow on a fixture project and produce output that matches the spec.

Both checks are run whenever the kit changes (a new template, a spec rule change, a rename, a doc edit). Running them is the definition of "the kit still works."

## Before a check

- Read `docs/ROADMAP.md` for the finalized starter-kit design and task status.
- Read `starter-kit/store-assets-workflow.md` (process) and `starter-kit/templates/store-rulebook.md.template` (rules) — these are what the kit must conform to.
- Record the change being verified (what was edited, and why) so a later session can tell what was under test.

## Conformance checklist

Static, per-file checks. Do not modify any file to pass a check — fix the kit, then re-check.

- [ ] **Package layout matches the finalized design** in `docs/ROADMAP.md`:
  - `store-assets-workflow.md` at kit root
  - a static `README.md` at kit root
  - `templates/store-rulebook.md.template` at package level
  - `microsoft-store/{current, release-prep, submissions, templates}/` present
  - `apple-app-store/` and `google-play/` present as empty reserved skeletons (each with `current`, `release-prep`, `submissions`, `templates`)
- [ ] **Static README**: the kit ships exactly one `README.md` (a static package overview, zero placeholders), plus the workflow and the rulebook template. It ships no `AGENTS.md`.
- [ ] **Placeholder discipline**: every `{{TOKEN}}` outside `templates/` is intentional spec text (variable tables, naming examples); generated documents never carry unresolved placeholders.
- [ ] **Template discipline**: every `templates/*.template` keeps its placeholders and its `template_version`; a version bump accompanies a template content change.
- [ ] **Placeholder policy**: the static README has zero placeholders; the generated rulebook may retain per-submission tokens (`LOCALE`, `SUBMISSION_ID`, `APPLICATION_VERSION`, `PUBLICATION_DATE`, `STATUS`) **only inside examples/file skeletons**, declared by its §1 placeholder policy.
- [ ] **Naming rules** (`store-rulebook.md.template` §5): directories lowercase kebab-case; locales official codes; files short lowercase kebab-case; no `final`/`new`/`latest`-style version words in screenshot names.
- [ ] **Relative links resolve**: every path referenced from a kit document exists (workflow → templates, DISTRIBUTION → kit, README → docs).
- [ ] **No sensitive content**: no secrets, keys, account data, or unredacted screenshots anywhere in the kit.
- [ ] **Terminology consistent**: lifecycle terms (current / release-prep / submissions / publish) match across the static `README.md`, `store-assets-workflow.md`, and the rulebook template.

## Dry-run behavior check

This is the behavioral test. A fresh agent session (no prior context) verifies the kit can drive the workflow.

### Execution modes

| Mode | Description | Status |
| --- | --- | --- |
| **Staged run** | Run the four phases as separate fresh agent sessions, one phase per session, verifying the produced files after each phase. | **Recommended** |
| Full run | One session executes all four phases. | Deprecated |

**Why staged runs are recommended (evidence, 2026-08-08):** three full-run attempts in the current headless environment all ended with the agent session going **silent** — no error, no new file, no final report — at different points: one after completing all four phases, one after phase 1, one while awaiting a go-live confirmation that a headless session can never receive. This is a harness limitation of long, single-session agent tasks (long context, interactive confirmations), not a kit defect. The produced files themselves were correct in the runs that had reached completion. Staging keeps each task short, makes any failure attributable to one phase, and lets the reviewer rely on **files, not on the agent's final message**.

If a staged run is not feasible, a full run is still acceptable on the condition that the result is judged by the produced files, not by whether the session produced a final report.

### Fixture (created once, reusable)

Create the fixture application project **outside the repository**, in a disposable location. It contains:

- a minimal `README.md` and `AGENTS.md` (any content)
- a PRD-like fact sheet: product name, target store, default locale, current app version, and one or two verifiable product features

The fixture is written once and reused by later runs. It holds only the inputs the workflow reads (a fake application project); it does not hold any run output.

### Run steps (staged)

Staged runs execute the workflow as four separate tasks, each with a fresh agent session inside the same run directory. Do not carry conversation history between tasks; each session reads only the files already in the run directory.

1. **Initialize** — agent reads the workflow, creates the standard structure for the confirmed values (product name, `microsoft-store`, default locale), generates `<PRODUCT_NAME>-store-assets.md` (the rulebook), and stops. Reviewer verifies the rulebook before continuing.
2. **Prepare an update** — agent creates `release-prep/<locale>/` (mirroring `current/`), fills listing/release-notes for one locale, never edits `current/`. Reviewer verifies the prepared files.
3. **Record** — agent writes `submissions/<submission-id>.md` with `status: Draft` and the submission variables. Reviewer verifies the record.
4. **Publish** — only because the session is explicitly told the app is live: agent promotes `release-prep/<locale>/` to `current/<locale>/`, sets `Published` + publication date. Reviewer verifies the promotion.

Each phase's task prompt must:
- scope the session to exactly one phase ("do only this phase, do not touch other files"),
- state the fixture facts in full (the session has no prior context),
- include the go-live confirmation when the phase needs it (phase 4 only),
- forbid tools that ask the user questions (there is no interactive user),
- instruct the agent to stop after the phase is done.

## Run lifecycle

Every run is a fresh, self-contained, disposable execution. It must never write outside its run directory and must leave nothing behind.

1. **Create a run directory** under a fixed QA workspace, outside the repository and outside the fixture:

   ```text
   <qa-workspace>/<run-id>/        # e.g. store-assets-qa/2026-08-08-verify-01/
   ```

   A fixed workspace (e.g. `store-assets-qa/`) makes leftover cleanup obvious — if it exists when a run starts, a previous run was not cleaned.

2. **Copy** the current `starter-kit/` into the run directory, renamed to `store-assets/`.

3. **Clear the workspace if stale**: any run directory left from an earlier run is a residue indicator. Confirm and remove it at the start of a new check (never silently; removing a run dir is safe — it is disposable).

4. **Document the fixture** the run uses (app version, locale) in the run result.

5. **Execute** the workflow as staged tasks (see "Dry-run behavior check" above), each phase a separate fresh session, entirely inside the run directory. Judge each phase by its produced files; a session that goes silent mid-task is a harness limitation — retry that phase in a fresh session rather than treating the run as failed.

6. **Verify** the assertions (below), staying read-only on the repository.

7. **Remove the run directory**: delete the entire run directory when the run is done. Nothing else is written anywhere. After deletion, nothing on the system is a leftover: no file apart from the repository itself was modified.

Reusing a run directory across runs is forbidden — each run gets a new one, and the workspace ends empty.

### Assertions

After the run, a reviewer (or a follow-up check) verifies:

- [ ] `store-assets/README.md` exists, is the static guide, and has no `{{...}}` placeholders.
- [ ] The rulebook `<PRODUCT_NAME>-store-assets.md` exists, named per `{{RULEBOOK_FILE}}`; its examples may keep per-submission tokens per its §1 policy, but project values are resolved.
- [ ] Directory names follow the rulebook's naming rules; `current/` was not modified before the publish step.
- [ ] `release-prep/<locale>/` mirrors `current/<locale>/` structurally.
- [ ] The submission record exists at `submissions/<submission-id>.md`, and its status reached `Published` only after the explicit go-live confirmation.
- [ ] No invented product capabilities appeared in the generated copy.
- [ ] The agent could complete the whole flow from the files alone (no missing instructions); with staged runs, this holds across the four sessions collectively.

## When to run

- After any edit to `starter-kit/` (template, workflow doc, or structure).
- After any edit that changes kit behavior or packaging (`docs/DISTRIBUTION.md`, packaging workflow).
- Before tagging a release.

## Result recording

Each run produces a short result report, written to the relevant task or commit message. Record at minimum:

- **Change under test** — what was edited and why.
- **Fixture** — the app version and locale the fixture used.
- **Outcome** — conformance items passed; dry-run outcome (`PASS` / `FAIL` / `PARTIAL`) and any gaps found (for example a missing instruction, an unresolved placeholder, a spec mismatch).
- **Cleanliness** — the residual check result: run directory created and removed, and confirmation that nothing remains outside the repository. Call it out explicitly if a leftover was found and removed.

These are recorded as text in the change's commit or task; per-run logs do not belong in the repository.

Suggested result snippet:

```text
QA run 2026-08-08-verify-01 — PASS
Change under test: [one line]
Fixture: product=fake-app locale=en-US version=v1.0.0
Conformance: all items passed
Dry-run: initialize → prepare → record → publish completed
Cleanliness: run dir `store-assets-qa/2026-08-08-verify-01/` created and removed; no leftover files
```