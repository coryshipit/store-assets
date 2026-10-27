# Store Assets QA

This document defines how the Store Assets `starter-kit/` is quality-checked.

It is a technical document for the repository itself. It is not user-facing usage instructions.

## What is tested

The starter kit combines a specification, templates, agent instructions, and an optional read-only checker. QA distinguishes package conformance, checker implementation behavior, and independent agent execution:

1. **Conformance** — the files always obey the rules defined in the kit's templates (`templates/store-rulebook.md.template`) and the process spec (`starter-kit/store-assets-workflow.md`): structure, naming, placeholder discipline, and prohibited content.
2. **Behavior** — a fresh agent session given only the copied kit can run the workflow on a fixture project and produce output that matches the spec.

The checker's automated tests validate deterministic findings, exit codes, standalone use, and absence of writes. They are implementation tests, not independent agent behavior verification.

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

[Checker scenarios](../tests/fixtures/checker/README.md) cover I.3 with the executable Node.js test suite. Run `node --test --test-reporter=spec tests/check-store-assets.test.mjs` after changing its parser, rules, Git access, output, or packaged invocation. Tests compare file/content inventories including local Git metadata, and exercise the script copied outside this repository. The user-facing invocation, parsing scope, and limits live in `starter-kit/checking.md`.

[Logo scenarios](../tests/fixtures/logo-assets/README.md) extend that suite for I.4: verified package-route roles, source/export/consumer mapping, PNG header checks, pending visual evidence, complete shared snapshots, and promotion path rebasing. Synthetic images are generated only in disposable execution copies. These implementation/artifact checks do not constitute fresh-agent behavior or live Store rendering evidence.

[Manual-upgrade scenarios](../tests/fixtures/manual-upgrade/README.md) cover I.5. Run `node tests/exercises/manual-upgrade.mjs` after changing provenance, upgrade ownership/merge rules, or release identity stamping. The constructed exercise preserves a prior-format local extension and active Draft, records a blocked/resumed upgrade with unknown original identity, and executes the actual stamping code extracted from the release workflow in a disposable staging copy. It is not an automatic updater or independent agent verification.

[Session scenarios](../tests/fixtures/session-handoff/README.md) cover I.6 startup, missing facts, record-based handoff and interface/customer language separation. `node tests/exercises/session-handoff.mjs` constructs orphan/recovered/submitted artifacts and checks saved handoff references with the copied checker. These are artifact/parser checks, not a test that an independent agent follows the instructions. The scenario file also maps initialization, listing-only, package, review-fix, promotion and upgrade tasks to their versioned inputs and expected invariants.

For independent execution, `tests/exercises/independent-scenarios.mjs prepare <scenario-id>` creates a fresh actor project and observer-only baseline outside it. Launch the actor separately without inherited development conversation; give it only its task and permitted fixture paths. `review <run-path>` reports file differences, saved records and copied-checker findings for human assessment, not an automatic behavior verdict. Check source/template identity, selected input variant, allowed writes, original event/snapshot evidence and semantic claims before recording an outcome; then `cleanup <run-path>` removes only the verified disposable root. The helper never launches an agent or writes this repository's Git history. A one-pass set of scenarios measures those tasks on the chosen executor; it does not establish cross-model reliability or actual store behavior.

### Focused strategy review (2026-10-23, Task I.6)

The `testing/qa-strategy` branch at `4e8b410850d426b8035cb0714687a4fc33487672` was inspected as design input: it changes `docs/ROADMAP.md` and adds `docs/TESTING-STRATEGY.md`. Its proposal is not merged. This file remains the QA policy; the following decisions apply to this iteration:

| Proposal | Decision on this branch |
| --- | --- |
| Separate deterministic, agent and actual-download evidence; version inputs/invariants | Adopt, while keeping constructed artifact exercises separate from implementation and independent-agent results |
| Select short independent scenarios by changed behavior | Adopt; the four-stage lifecycle sequence remains an optional integration diagnostic, not a required substitute for focused scenarios |
| Explain historical silence as known context/headless causes | Retain only as hypotheses; silence without sufficient artifacts cannot establish a product or harness cause |
| PASS/FAIL/INCONCLUSIVE with one inconclusive retry | Adopt; missing execution is `not run`, never a PASS or an automatic INCONCLUSIVE |
| Allow deterministic/download checks to waive agent gaps | No implicit waiver: the release review still needs an explicit maintainer decision for omitted applicable behavior or unresolved INCONCLUSIVE evidence |
| Promote a complex harness or all proposed future automation into current scope | Defer; current small checkers/artifact exercises and portable scenarios provide the available evidence |

This completes the focused policy/scenario alignment for I.6. The first independent execution set is recorded in [the iteration review](DIRPILOT-ITERATION.md#independent-scenario-review-2026-10-23); broader Task G evaluation of repeated execution, costs/reliability and release gates remains open. A prepared scenario is not an executed scenario.

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
  - `checking.md` and `scripts/check-store-assets.mjs` shipped together
  - `upgrading.md`, `provenance.json`, and `examples/manual-upgrade.md` ship together; source defaults and template markers agree
  - `examples/session-handoff.md` ships with workflow startup/missing-fact/handoff sections; it creates no separate authoritative status file
  - `microsoft-store/{current, release-prep, submissions, templates}/` present
  - `microsoft-store/asset-rules.md`, its versioned JSON inventory template, and `examples/logo-assets.md` ship together
  - `apple-app-store/` and `google-play/` present as empty reserved skeletons (each with `current`, `release-prep`, `submissions`, `templates`)
- [ ] **Static README**: the kit ships exactly one `README.md` (a static package overview, zero placeholders), plus the workflow and the rulebook template. It ships no `AGENTS.md`.
- [ ] **Placeholder discipline**: every `{{TOKEN}}` outside `templates/` is intentional spec text (variable tables, naming examples); generated documents never carry unresolved placeholders.
- [ ] **Template discipline**: every template keeps its format's `template_version`; a version bump accompanies a template content change. Rulebook placeholders remain intentional; the JSON inventory template uses explicit unknown/null/pending inputs for task-time completion.
- [ ] **Placeholder policy**: the static README has zero placeholders; the generated rulebook may retain per-submission tokens (`LOCALE`, `SUBMISSION_ID`, `APPLICATION_VERSION`, `PUBLICATION_DATE`, `STATUS`) **only inside examples/file skeletons**, declared by its §1 placeholder policy.
- [ ] **Naming rules** (`store-rulebook.md.template` §5): directories lowercase kebab-case; locales official codes; files short lowercase kebab-case; no `final`/`new`/`latest`-style version words in screenshot names.
- [ ] **Relative links resolve**: every path referenced from a kit document exists (workflow → templates, DISTRIBUTION → kit, README → docs).
- [ ] **No sensitive content**: no secrets, keys, account data, or unredacted screenshots anywhere in the kit.
- [ ] **Terminology consistent**: lifecycle terms (current / release-prep / submissions / publish) match across the static `README.md`, `store-assets-workflow.md`, and the rulebook template.
- [ ] **Historical references**: attempt examples use complete candidate scope and distinguish working paths from immutable Git references. No new requirement assumes the referencing record is already inside its assets commit.
- [ ] **Time semantics**: actual submission/platform dates, go-live receipt dates, and event observation/recording times are distinct. Published status is compatible with an unknown platform date; legacy dates are not silently reinterpreted.
- [ ] **Checker delivery**: the copied CLI runs without repository-only imports/npm dependencies; no files, Git index/config/objects, or submission facts are changed. Test errors/review/incomplete outcomes independently; exit 0 is not a readiness assertion.
- [ ] **Logo roles**: technical assertions have official sources/review dates and package/product/device applicability. Each example export has a source and real upload consumer; no universal package-icon size matrix or invented MSI/EXE pixel requirement is imposed. Shared consumers and complete candidate/frozen scopes are explicit; promotion changes inventory path prefixes only. Technical, visual, upload, and live-page evidence remain distinct.
- [ ] **Upgrade safety**: installed provenance retains unknown origin and local adaptations/history. Manual comparisons classify shipped/generated/application-owned paths and preserve all current/candidate/submission bytes and immutable references. Existing rulebooks are merged without blanket regeneration. Release stamping mutates only the staging provenance, records the actual tag/source commit and verifies upstream template markers; it never includes installed-project history.
- [ ] **Session continuity**: ownership/state is established from all relevant saved records/candidates before writes; checks/findings are scoped and independent work can continue. Handoff uses existing record fields/Open items/Review notes, preserves event history, and references canonical copy. Interface language and customer locale remain separate; unobserved UI labels and external evidence stay unknown.

## Dry-run behavior check

This is the behavioral test. A fresh agent session (no prior context) verifies the kit can drive the workflow.

### Execution modes

| Mode | Description | Status |
| --- | --- | --- |
| **Focused scenario** | Start a fresh session from one versioned input state and perform the single affected task; inspect files/actions afterward. | **Recommended** |
| Staged lifecycle run | Run the four integration phases as separate fresh sessions with explicit evidence and boundaries. | Optional diagnostic |
| Full run | One session executes all four phases. | Deprecated |

**Historical reason to keep sessions short (2026-08-08):** three full-run attempts ended with the agent session going silent at different points: one after completing all four phases, one after phase 1, one while awaiting a go-live confirmation. Long sessions and unavailable interaction are possible harness causes; silence alone does not establish the cause or the kit's correctness. Staging remains useful for integration diagnosis; focused scenarios are the default for affected behavior.

Select the applicable scenarios from the versioned matrix; a full run is not a fallback requirement when focused/staged execution is unavailable. If no suitable independent executor is used, record affected agent scenarios as `not run` and report the available artifact/implementation evidence separately.

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

Each scenario/phase's task prompt must:
- scope the session to exactly one phase ("do only this phase, do not touch other files"),
- supply the fixture facts/state in files or in the task, with no prior chat/development context,
- include the go-live confirmation when the phase needs it (phase 4 only),
- forbid interactive question tools in a headless run; missing-prerequisite scenarios must report the missing decision and preserve dependent files instead of guessing an answer,
- instruct the agent to stop after the phase is done.

## Run lifecycle

Every scenario execution is fresh and disposable. Its actor must not write outside its run directory. A staged integration execution may share its one project across successive fresh sessions; the session context is fresh, while the previous phase's real outputs are the next phase's inputs. Never repair a failed output and count the repaired sequence as an agent PASS.

1. **Create a run directory** under a fixed QA workspace, outside the repository and outside the fixture:

   ```text
   <qa-workspace>/<run-id>/        # e.g. store-assets-qa/2026-08-08-verify-01/
   ```

   A fixed workspace (e.g. `store-assets-qa/`) makes leftover cleanup obvious — if it exists when a run starts, a previous run was not cleaned.

2. **Copy** the current `starter-kit/` into the run directory, renamed to `store-assets/`.

3. **Handle stale residue**: identify an earlier execution directory by its known path/ownership before cleanup; report discovered residue and preserve evidence needed for diagnosis. Never delete an unknown directory or reuse old outputs as a new input. Disposable runners must verify resolved cleanup targets stay in their intended temporary root.

4. **Document the fixture** the run uses (app version, locale) in the run result.

5. **Execute** the selected scenario or staged tasks entirely inside the run directory. Label artifact exercises and fresh-agent scenarios separately. Judge each by produced files; use the result and finite-retry rules above if a session goes silent.

6. **Verify** the assertions (below), staying read-only on the repository.

7. **Record and clean**: inspect the artifacts/actions needed for the result, report path/hash and scope evidence, then remove the verified execution directory. Do not claim global system cleanliness from a project-only inventory; distinguish controlled project writes from executor-owned logs/caches outside the scenario. Keep reusable sources in Git, never per-run logs/artifacts.

A retry starts from the original fixture in a new directory and fresh context. At most one retry is allowed for an INCONCLUSIVE scenario; a definite FAIL calls for a fix and a new explicitly identified run. Shared directories are allowed only across phases of the same declared staged execution, never across independent scenarios or retries.

### Assertions

After the run, a reviewer (or a follow-up check) verifies:

- [ ] `store-assets/README.md` exists, is the static guide, and has no `{{...}}` placeholders.
- [ ] When initialization/generation is in scope, the rulebook exists with its required name and resolved project values. Existing local rules stay preserved for other tasks; intentional example tokens follow §1 policy.
- [ ] Directory names follow the applicable rules; current/candidate/history contents are preserved except for the selected scenario's authorized writes.
- [ ] When preparation is in scope, its complete locale/shared snapshots describe the intended future state; orphan/read-only cases preserve their supplied incomplete inputs.
- [ ] A record is created/updated only when task prerequisites establish it. A supplied orphan must not acquire a guessed record. Published/promotion requires its identified attempt's explicit go-live confirmation.
- [ ] No second active submission exists for the tested store adapter.
- [ ] No invented product capabilities appeared in the generated copy.
- [ ] For a focused scenario, its affected invariants and allowed write scope hold from files/actions alone. For a staged execution, each phase's invariants hold and all state transfer comes from the produced files. An orphan/missing-fact scenario can pass by deliberately preserving state and reporting the required decision.

An intentionally broken input can produce the expected checker exit/error finding while its scenario passes: the assertion is that the omission is detected and preserved/recovered only within the task's scope. This does not make the faulty input submission-ready. Evaluate actor actions and fixture invariants separately from raw checker exit codes.

## When to run

- Run conformance after any edit to `starter-kit/` and after changes to packaging rules/workflows.
- Select affected scenarios after changing workflow behavior, templates, or structure. Do not require unrelated lifecycle stages for a focused task change.
- Before tagging a release, review conformance, applicable scenario coverage, and package evidence. After building the draft asset, verify the actual download before publishing.

## Result recording

Each run produces a short result report, written to the relevant task or commit message. Record at minimum:

- **Change under test** — what was edited and why.
- **Fixture** — the app version and locale the fixture used.
- **Outcome** — conformance, artifact exercise, and fresh-agent results separately (`PASS` / `FAIL` / `INCONCLUSIVE`, or `not run`); include gaps such as missing instructions, unresolved placeholders, or spec mismatches.
- **Cleanup** — the controlled run directory's before/after inventory and removal result, plus any observed residue within the inspected scope. Do not infer that nothing remains elsewhere on the system from a project-only inventory; describe executor-owned logs/caches only when they were actually inspected.

These are recorded as text in the change's commit or task; per-run logs do not belong in the repository.

Suggested result snippet:

```text
Change under test: [specific startup/rule/template change]
Fixture/scenario: [versioned source and ID; kit revision/template; runtime/executor]
Conformance: PASS [scope]
Implementation/artifact exercise: PASS [actual assertions]
Independent agent: not run [reason], or PASS/FAIL/INCONCLUSIVE [observed invariants/actions; attempt/retry count]
Actual release download: not run [not a release task], or PASS/FAIL [tag/asset/source evidence]
Cleanliness: [controlled run path and observed before/after scope; cleanup/residue; executor limits]
```

## Release evidence review

Before publishing a later release, record conformance, applicable implementation/artifact checks, selected agent scenarios, exact package source identity and actual downloaded draft asset inspection separately. Check the `store-assets/` archive root, required paths, static entry points, stamped provenance/tag/source/template consistency, and that source bytes match except for the documented provenance stamp. The maintainer explicitly accepts any omitted applicable agent scenario or unresolved INCONCLUSIVE result in release/task notes before publication; neither a local ZIP check nor a previous release exception supplies that decision. This QA procedure does not authorize pushing a tag or publishing a release.
