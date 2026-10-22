# Store Assets QA

This document defines how the Store Assets `starter-kit/` is quality-checked.

It is a technical document for the repository itself. It is not user-facing usage instructions.

## What is tested

The starter kit is a spec plus templates plus agent instructions, not a program. QA checks two invariants:

1. **Conformance** — the files always obey the rules defined in the kit's templates (`templates/store-rulebook.md.template`) and the process spec (`starter-kit/store-assets-workflow.md`): structure, naming, placeholder discipline, and prohibited content.
2. **Behavior** — a fresh agent session given only the copied kit can run the workflow on a fixture project and produce output that matches the spec.

Conformance checks are required whenever the kit changes. Select behavioral scenarios for the rules that changed; a wording or navigation edit does not require a full lifecycle run. Assess results from files and observable actions, not an agent's final claim.

### Focused verification decision (2026-10-22, Task I.1)

The iteration adopts the following limited adjustment after reviewing the `testing/qa-strategy` proposal. This does not complete Task G or adopt that branch wholesale.

| Evidence | Use |
| --- | --- |
| Conformance | Required for affected files; full kit conformance for workflow/template changes |
| Artifact exercise | Copy only the kit plus versioned fictional application inputs outside the repo; exercise the changed rules and inspect outputs. Label this separately from fresh-agent verification |
| Fresh-agent scenario | Supplement behavioral changes with an independent session where available. Record unrun scenarios explicitly; an artifact exercise by an agent with development context is not an independent behavior PASS |
| Release artifact | Before publishing, verify the built archive and actual downloaded asset; no local exercise substitutes for that check |

Reusable facts, prompts, input states, and expected invariants belong under `tests/fixtures/`. They contain no real application data. Their execution copies and per-run logs remain outside the repository. [Update-task scenarios](../tests/fixtures/update-tasks/README.md) cover I.1.

[Submission-history scenarios](../tests/fixtures/submission-history/README.md) cover I.2. Their PowerShell artifact exercise uses local disposable Git repositories to verify snapshot retrieval, resubmissions, promotion/removals, dirty or missing content, and time/source recording. Its constructed artifacts demonstrate the reference contract; they are not a fresh-agent behavior PASS or the I.3 application validator.

For each evidence item use `PASS`, `FAIL`, or `INCONCLUSIVE`. Record a scenario that was not attempted as `not run`, with the reason; do not call it PASS or INCONCLUSIVE. Silence, timeout, or a tool failure is INCONCLUSIVE only when the available artifacts cannot decide the result. Retry an inconclusive scenario at most once, then report the evidence and limitation without assuming a harness or product cause.

For development review, report passed checks and remaining behavioral coverage separately. Before release, any omitted applicable behavioral scenario or unresolved inconclusive result requires an explicit maintainer decision recorded in the release/task notes. This iteration is not a release exception.

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
- [ ] **Historical references**: attempt examples use complete candidate scope and distinguish working paths from immutable Git references. No new requirement assumes the referencing record is already inside its assets commit.
- [ ] **Time semantics**: actual submission/platform dates, go-live receipt dates, and event observation/recording times are distinct. Published status is compatible with an unknown platform date; legacy dates are not silently reinterpreted.

## Dry-run behavior check

This is the behavioral test. A fresh agent session (no prior context) verifies the kit can drive the workflow.

### Execution modes

| Mode | Description | Status |
| --- | --- | --- |
| **Staged run** | Run the four phases as separate fresh agent sessions, one phase per session, verifying the produced files after each phase. | **Recommended** |
| Full run | One session executes all four phases. | Deprecated |

**Why staged runs are recommended (evidence, 2026-08-08):** three full-run attempts ended with the agent session going silent at different points: one after completing all four phases, one after phase 1, one while awaiting a go-live confirmation. Long sessions and unavailable interaction are possible harness causes; silence alone does not establish the cause or the kit's correctness. Staging keeps tasks short and permits assessment from files. Prefer independent, affected scenarios when a full lifecycle is unnecessary.

If a staged run is not feasible, a full run is still acceptable on the condition that the result is judged by the produced files, not by whether the session produced a final report.

### Fixture (created once, reusable)

Keep reusable fixture inputs versioned under `tests/fixtures/`. Create the fixture application execution copy **outside the repository**, in a disposable location. It contains:

- a minimal `README.md` and `AGENTS.md` (any content)
- a PRD-like fact sheet: product name, selected store adapter (`microsoft-store`), default locale, current published app version, and one or two verifiable product features

Fixture sources hold only declared inputs, prompts, and expected invariants, not run outputs. Every scenario starts from its specified state in a new execution copy; do not repair outputs manually and then count the agent scenario as passing.

### Run steps (staged)

Staged runs execute the workflow as four separate tasks, each with a fresh agent session inside the same run directory. Do not carry conversation history between tasks; each session reads only the files already in the run directory.

1. **Initialize** — agent reads the workflow, creates the standard structure for the confirmed values (product name, `microsoft-store`, default locale), generates `<PRODUCT_NAME>-store-assets.md` (the rulebook), and stops. Reviewer verifies the rulebook before continuing.
2. **Prepare and record** — agent creates `release-prep/<locale>/` as a complete candidate snapshot, fills listing/release-notes for one locale, creates `submissions/<submission-id>.md` with `status: Draft`, and never edits `current/`. Reviewer verifies both the prepared files and record.
3. **Track submission** — agent updates the existing record after an explicitly supplied store event, for example `Submitted` or `In certification`. Reviewer verifies the status transition and confirms no second active submission was created.
4. **Publish** — only because the session is explicitly told the identified attempt is live: agent records Published and the sourced confirmation date, verifies the frozen snapshot, replaces `current/<locale>/` with that approved tree, records local promotion, and removes only the completed preparation. Platform publication date stays empty unless independently supported by the supplied evidence. Reviewer verifies the promotion and history references.

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

5. **Execute** the selected scenario or staged tasks entirely inside the run directory. Label artifact exercises and fresh-agent scenarios separately. Judge each by produced files; use the result and finite-retry rules above if a session goes silent.

6. **Verify** the assertions (below), staying read-only on the repository.

7. **Remove the run directory**: delete the entire run directory when the run is done. Nothing else is written anywhere. After deletion, nothing on the system is a leftover: no file apart from the repository itself was modified.

Reusing a run directory across runs is forbidden — each run gets a new one, and the workspace ends empty.

### Assertions

After the run, a reviewer (or a follow-up check) verifies:

- [ ] `store-assets/README.md` exists, is the static guide, and has no `{{...}}` placeholders.
- [ ] The rulebook `<PRODUCT_NAME>-store-assets.md` exists, named per `{{RULEBOOK_FILE}}`; its examples may keep per-submission tokens per its §1 policy, but project values are resolved.
- [ ] Directory names follow the rulebook's naming rules; `current/` was not modified before the publish step.
- [ ] `release-prep/<locale>/` is a complete candidate snapshot that mirrors the intended `current/<locale>/` structure.
- [ ] The submission record exists at `submissions/<submission-id>.md`, and its status reached `Published` only after the explicit go-live confirmation.
- [ ] No second active submission exists for the tested store adapter.
- [ ] No invented product capabilities appeared in the generated copy.
- [ ] The agent could complete the whole flow from the files alone (no missing instructions); with staged runs, this holds across the four sessions collectively.

## When to run

- Run conformance after any edit to `starter-kit/` and after changes to packaging rules/workflows.
- Select affected scenarios after changing workflow behavior, templates, or structure. Do not require unrelated lifecycle stages for a focused task change.
- Before tagging a release, review conformance, applicable scenario coverage, and package evidence. After building the draft asset, verify the actual download before publishing.

## Result recording

Each run produces a short result report, written to the relevant task or commit message. Record at minimum:

- **Change under test** — what was edited and why.
- **Fixture** — the app version and locale the fixture used.
- **Outcome** — conformance, artifact exercise, and fresh-agent results separately (`PASS` / `FAIL` / `INCONCLUSIVE`, or `not run`); include gaps such as missing instructions, unresolved placeholders, or spec mismatches.
- **Cleanliness** — the residual check result: run directory created and removed, and confirmation that nothing remains outside the repository. Call it out explicitly if a leftover was found and removed.

These are recorded as text in the change's commit or task; per-run logs do not belong in the repository.

Suggested result snippet:

```text
QA run 2026-08-08-verify-01 — PASS
Change under test: [one line]
Fixture: product=fake-app locale=en-US version=v1.0.0
Conformance: all items passed
Dry-run: initialize → prepare and record → track → publish completed
Cleanliness: run dir `store-assets-qa/2026-08-08-verify-01/` created and removed; no leftover files
```
