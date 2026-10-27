# DirPilot Feedback Iteration Plan

Date: 2026-10-22

Development branch (merged into `main` on 2026-10-27): `iteration/dirpilot-feedback`

Status: plan accepted on 2026-10-22; I.1-I.6 implemented and merged into `main` on 2026-10-27; ten selected independent scenarios passed on 2026-10-23; versioned package/release verification remains pending

## 1. Purpose and evidence

Improve the existing Microsoft Store update workflow using the DirPilot usage review dated 2026-10-22. The maintainer supplied `store-assets-dirpilot-usage-feedback-2026-10-22.md` from the protected, local-only `reference/` directory. This plan summarizes the relevant findings so development does not depend on that local file or conversation history.

The review reports that separating live and candidate assets, recording submissions, and waiting for explicit go-live confirmation were useful. It also reports an actual omission: a Logo update candidate was created without its own Draft record. Other gaps concern version applicability, asset roles, historical references, dates, local adaptations, and session handoff. The underlying DirPilot repository has not been independently audited for this iteration.

The maintainer accepted the staged plan on 2026-10-22, authorized I.1, then authorized I.2 after I.1 was committed and pushed. This does not approve every suggestion or finalize later schemas. Work proceeds one stage at a time, with a concrete change and verification result reviewed before the next stage.

## 2. Scope and boundaries

- Improve updates to existing Microsoft Store listings, including updates that change only listing content or assets.
- Keep the shared lifecycle and separate store-specific rules. Apple and Google remain reserved skeletons.
- Preserve one active submission per store, complete candidate snapshots, and explicit go-live confirmation before promotion.
- Keep application engineering, package building, signing, WACK, upload, and certification with the application project and official tools. Store Assets may reference their evidence.
- Do not modify `reference/`, DirPilot files, external store state, or existing user records as part of this repository iteration.
- Treat first-submission support as a separate product decision. The default for this plan remains the existing updates-only scope; document the boundary and handoff without generating first-submission assets.
- Do not add automated upload, a general CLI, an automatic updater, or a new store adapter.

## 3. Order and dependencies

Priority describes implementation order, not a promised release date. Stage IDs map back to the review's six directions.

| Stage | Priority | Review direction | Result | Depends on |
| --- | --- | --- | --- | --- |
| I.1 | P0 | 5.1 Task types and versions | A Logo-only update has a complete Draft without an invented package or version | Existing workflow |
| I.2 | P0 | 5.4 Historical snapshots and dates | Old submitted assets remain locatable and dates identify their evidence | I.1 |
| I.3 | P0 | 5.2 Omission detection | A read-only check detects orphan candidates and other structural errors | Stable I.1/I.2 record rules; focused Task G work |
| I.4 | P1 | 5.3 Asset roles and mapping | Logo files have verified roles, sources, and upload destinations | I.1-I.3 |
| I.5 | P1 | 5.5 Provenance and upgrades | A locally adapted kit can be upgraded without losing user data or rules | I.1-I.4 formats |
| I.6 | P1 | 5.6 Session startup and handoff | A fresh session identifies the active task, gaps, and safe next action | I.1-I.5 |

The first milestone is I.1-I.3: task semantics, durable evidence, and a way to detect the reported omission. The second milestone completes I.4-I.6. Minimal handoff instructions and provenance notes should accompany earlier changes where needed; I.6 and I.5 consolidate and verify them.

## 4. Stage details

### I.1 — Make task types and version applicability explicit

Development work:

1. Define package updates and listing/asset-only updates as explicit task types within the existing lifecycle. Define how a mixed update is represented.
2. Separate the released application version, candidate application version, package version/evidence, and repository submission identifier. A local submission ID is not a store-issued ID; record an external ID separately only when known.
3. Specify required, unknown, and not-applicable values for each task type. A listing-only update retains the confirmed released application version; it does not require a new package or automatically increment a version. Unknown package evidence may block submission readiness without blocking independent preparation work.
4. Make candidate preparation and Draft creation one deliverable. Define how to report and recover an existing orphan candidate without deleting files, inventing its provenance, or opening a second active submission.
5. Update the variable contract, record skeleton, ready checklist, and user entry instructions together. Preserve the current first-submission boundary.

Expected paths: `starter-kit/store-assets-workflow.md`, `starter-kit/templates/store-rulebook.md.template`, `starter-kit/README.md`, and root `README.md` where the task entry needs clarification. Keep record skeletons in the rulebook unless a separate template is justified by the design.

Acceptance:

- A fictional published application at `1.0.0` can prepare a Logo-only candidate and one Draft with package fields marked not applicable.
- `current/` remains unchanged; no new package or application version is invented.
- A package update with missing evidence records the gap and cannot be reported ready for submission.
- An existing active submission and an orphan candidate produce explicit recovery guidance.

### I.2 — Preserve submitted snapshots and distinguish dates

Development work:

1. Define a compact record format for candidate creation, actual submission, observed status, platform publication when known, and user go-live confirmation. Record event time separately from observation/recording time when they differ, with source and timezone/precision as applicable.
2. Define when the approved candidate is frozen, which immutable Git revision and paths identify the submitted assets, and how a resubmission after fixes retains its earlier attempt's reference.
3. Avoid a circular requirement that a record reference a future commit containing itself: commit the approved assets first, then record their revision. Define this as an explicit workflow step; do not silently commit unrelated user changes merely to fill a snapshot field.
4. Keep convenient `current/` links, but require a durable asset reference for historical tracking. Specify what happens when assets are uncommitted, Git history is unavailable, or only a partial clone is present; never report an unresolved snapshot as verified.
5. Explain how legacy `Submission date` and `Publication date` are interpreted or preserved. Do not silently reinterpret old dates or fill unknown platform timestamps from a user's confirmation date.

Expected paths: workflow, rulebook template, and reusable fictional examples/fixtures. User-facing explanations must ship in `starter-kit/`, not only this design document.

Acceptance:

- After two simulated publications replace `current/`, the first record still resolves to the first submitted assets.
- A rejected submission followed by corrected assets retains distinct references for the two attempts.
- A user report of "it is live now" records confirmation and its source while leaving unknown platform publication time unknown.
- Missing or dirty snapshots are visible gaps; no future SHA or event time is invented.

### I.3 — Detect structural omissions with a read-only check

Development work:

1. Stabilize the record fields and their parsing contract from I.1/I.2 before implementing checks. Do not force all stores into a universal metadata schema.
2. Define the input root/store, write scope (none), findings, failure modes, and runtime requirements. Delivered as `starter-kit/scripts/check-store-assets.mjs`, one Node.js 22+ standard-library module with an explicit input root. The original Python candidate was replaced after runtime review: the development environment has Node.js 24 and no usable Python interpreter, so no additional runtime installation or third-party dependency is needed here. No installation service or automatic repair is included.
3. Check candidate-to-record association, active submission count, allowed statuses, task-dependent fields, locale coverage, referenced files, project placeholders, and durable snapshot references. Distinguish an unused directory containing only `.gitkeep` from a real candidate.
4. Define applicability by lifecycle stage. A new Draft need not already have a submitted snapshot. Archived references resolve against their recorded Git revision, not only today's filesystem. Check legal transitions from event evidence where available; do not infer transition history from a valid current status alone.
5. Allow recorded additions/removals and store-wide assets; do not equate candidate completeness with byte-for-byte equality to `current/` or assume every asset belongs to a locale.
6. Report structural errors, items needing confirmation, and informational findings separately, with record/path and repair guidance. Proposed exit codes: `0` for completed checks without structural errors, `1` for structural errors, `2` for invalid input or inability to complete checks. Exit `0` alone is not submission readiness or proof of publication.
7. Add reusable synthetic fixtures and checks for the checker itself. Verify it leaves the input tree unchanged. Explain its manual use and limitations in the copied kit.

Expected paths: a small script and usage instructions in `starter-kit/`; versioned fixtures and assertions under a new repository test directory; `docs/QA.md`, `docs/DISTRIBUTION.md`, and the release workflow only where the new package contract requires them.

Acceptance:

- Missing Draft, two active records, invalid status, missing image, locale mismatch, unresolved project placeholder, and a broken historical reference each produce a locatable finding.
- A valid listing-only update, intentional asset deletion, untouched reserved adapters, and an initialized kit with no candidate pass the applicable structural checks.
- An incomplete package update and a legacy record without enough evidence are reported according to the documented applicability rules; neither causes guessed facts or rewritten records.
- Inputs have identical file contents before and after the check. Unavailable Git/runtime/input errors are distinguished from detected content errors.

### I.4 — Add asset roles, provenance, and upload mapping

Development work:

1. Research current official Microsoft requirements for the Logo upload roles actually supported. Record authoritative sources, review date, and relevant product/package distinctions before publishing technical constraints.
2. Design the smallest extensible asset inventory: role, destination field, locale or store-wide scope, source, derivative, dimensions/format, transparency where applicable, generation method, and review state.
3. Define ownership for store-wide versus localized assets and how a complete candidate carries them. Preserve existing screenshot `source/` and `export/` semantics; assess compatibility before adding directories.
4. Separate package icons from store listing Logos even if they share a source. Include a fictional Logo example with real consumers for every derivative; do not require a universal size matrix.
5. Extend the checker only for deterministic constraints supported by the accepted inventory. Leave visual clarity, background appearance, upload success, and live rendering to explicit review/evidence.

Expected paths: Microsoft-specific rules/examples in `starter-kit/`, workflow/rulebook references, checker and fixtures. Exact inventory filename and asset directory layout remain design decisions for this stage.

Implementation decision (2026-10-23): the copied Microsoft adapter now ships `asset-rules.md` and `templates/asset-inventory.json.template` (inventory schema/template `1` / `1.0.0`). Inventories live at `<state>/<locale-or-shared>/asset-inventory.json`, with owned `logos/source/` and `logos/export/`; existing screenshot layout is unchanged. Paths are kit-root-relative and state-specific, rebased only in copied/prepared or promoted inventories. Shared files have explicit per-language consumers and complete tree/snapshot ownership. The checker compares the shared candidate with its archived baseline so unchanged consumers do not require unrelated locale preparation; changed/removed rows and source/export bytes retain all affected consumers.

Official sources reviewed on 2026-10-23 establish the MSIX Desktop application tile's 300 x 300 PNG role and the distinct MSI/EXE box/poster roles. The latter page does not establish numeric sizes/encoding/alpha acceptance, so those remain sourced upload-field review items. Game/Xbox/PWA-specific roles and screenshot technical validation are outside this implementation's automatic role checks. Rulebook template `1.5.0`, the fictional Logo example, checker extensions, reusable scenarios, and packaging requirements ship together. Legacy files receive review findings, not inferred mappings or automatic migration.

Acceptance:

- Every example export maps to a documented upload field and a traceable source.
- Size/format assertions cite verified Microsoft rules; the DirPilot dimensions alone are not treated as platform requirements.
- Technical checks and human visual review are distinguishable; candidate completion does not claim the live Logo problem is fixed.

### I.5 — Record origin and make manual upgrades safe

Development work:

1. Define one compact provenance record for upstream release/commit, upstream template version, local adaptations, and upgrade history. Keep toolkit release, template, product, and package versions distinct.
2. Allow an unknown origin for existing projects. Do not infer the originally downloaded release from a locally incremented template version.
3. Document a manual compare-and-merge upgrade: identify upstream changes, surface conflicts, preserve local rules, and leave live assets, active candidates, and history intact.
4. Replace blanket regeneration guidance where it could erase local rulebook adaptations. Define which shipped files can be compared/replaced and which generated/user files need deliberate merging.
5. Verify an upgrade from the previous kit format with a local first-submission extension and an active candidate. Preserve that extension as local customization without claiming upstream first-submission support.

Expected paths: kit README/workflow, rulebook template, a small provenance format if needed, repository distribution/release guidance, and upgrade fixtures. No automatic updater.

Implementation decision (2026-10-23): one kit-root `provenance.json` (schema `1`) retains last integrated upstream repository/release/full source commit/template versions, local adaptations, and append-only upgrade history with from/to identities, per-path decisions, conflicts and verification. Source copies leave unestablished release/commit values unknown; a tag build stamps only its archive-staging copy after checking actual template markers. A blocked upgrade keeps the previous top-level identity; completion retains unknown prior origin and deliberate local differences in history/adaptations. `upgrading.md` defines ownership, separate review copies, unknown-baseline comparison, manual rulebook merging and I.1-I.4 migration boundaries. Rulebook template `1.6.0` removes blanket regeneration guidance. All store current/candidate/submission files are preserved during a toolkit upgrade; needed record/asset migrations are separately scoped application work.

Acceptance:

- The user can identify upstream origin, local differences, and unresolved conflicts.
- An unknown origin remains explicitly unknown.
- Upgrade comparison preserves customized rules and all unrelated asset/history contents; any migration needed by I.1-I.4 is explicit and reviewable.

### I.6 — Improve session startup, handoff, and focused verification

Development work:

1. Add a short startup sequence that reads the workflow and existing rulebook, identifies live state and active work, runs applicable checks, then reads only the task's relevant facts/assets.
2. Define a concise end-of-task handoff derived from existing records: changed paths, evidence, unresolved findings, required user/store action, and next step. Do not introduce a separately maintained status dashboard or duplicate copy source.
3. Keep store interface language separate from customer-facing locale. Any field mapping records its source/date and references the canonical listing text.
4. Define which work can continue when information is missing and which dependent action must wait. Preserve explicit go-live confirmation and facts that remain unverified.
5. Complete focused Task G work: synchronize QA terminology, deterministic checks, independent agent scenarios, finite retry rules, and release evidence. Evaluate the existing `testing/qa-strategy` proposal explicitly before reusing it; it is not accepted policy on this branch.

Expected paths: kit workflow/README/rulebook as applicable, `docs/QA.md`, `docs/ROADMAP.md`, and reusable scenario inputs/expected invariants.

Implementation decision (2026-10-23): workflow §§1.3–1.4 establishes selected-store ownership/archive state from saved files before writes, scopes read-only checks and task facts, and separates independent preparation from dependent actions needing evidence. Workflow §5 keeps continuation in existing fields/Open items/Review notes or the current provenance entry, with a concise derived final report; read-only tasks add no notes or parallel dashboard. Interface-language mappings retain observation source/date and canonical field/inventory references without changing customer locales or copying canonical text. Rulebook template `1.7.0`, the kit session example, and ten versioned scenario tasks/invariants ship together. QA explicitly evaluates the `testing/qa-strategy` proposal, selects focused independent scenarios, distinguishes all evidence types, and clarifies staged versus retry cleanup and actual downloaded release evidence. Constructed handoff/upgrade/checker checks passed. Subsequent independent execution of the ten selected scenarios also passed; scope and observed invariants are recorded below.

Acceptance:

- A fresh session with only copied project files and a single task identifies an orphan Logo candidate and the safe recovery action.
- Representative scenarios cover existing-listing initialization, listing-only update, package update, review feedback, promotion, and upgrade preservation. First-submission tests are conditional on a separate scope decision.
- Agent results are assessed from produced files and observable behavior. Lack of a final reply is not automatically a product failure or a pass.
- Results distinguish `PASS`, `FAIL`, and `INCONCLUSIVE`; an inconclusive scenario has at most one retry before recording the limitation.

## 5. Verification and milestone review

The focused QA adjustment for I.1 is now recorded in `docs/QA.md`: required conformance, separately labeled artifact exercises, fresh-agent coverage where available, finite retry rules, and distinct release-artifact evidence. Broader Task G work is not complete. Do not mark independent behavior PASS from an artifact exercise or merely because scenarios have been listed.

Create versioned synthetic facts, prompts, input states, and expected invariants in the repository. Execute behavioral scenarios in disposable copies outside the repository. Do not use DirPilot's real accounts, personal data, application code, or store submissions as fixtures. Separate deterministic checker tests from fresh-agent behavior tests.

First milestone scenario:

1. Start from a fictional published `1.0.0` application with a committed live snapshot.
2. Prepare a Logo-only change, including a planned asset removal, and one independent Draft; retain the application version and mark package evidence not applicable.
3. Deliberately omit the Draft in a separate fixture and verify that the checker detects it.
4. Freeze approved assets and record an explicitly supplied submission event; record the immutable asset reference without changing `current/`.
5. Supply explicit fictional go-live confirmation, promote the complete snapshot, and retain unknown platform timestamps as unknown.
6. Repeat a publication and verify that the first record still resolves to its original assets.

This is a repository behavior simulation, not a real store publication. The P0 fixture may use a synthetic asset path without claiming any Microsoft image specification; I.4 adds verified platform mappings.

For each stage, review the spec/template diff, applicable checks, remaining uncertainties, and compatibility implications before proceeding. Bump `template_version` whenever the template changes. Keep reusable specifications and fixtures in Git; keep per-run logs out of the repository. A later release additionally needs package checks, versioned release notes, and verification of the actual downloaded artifact.

### Independent scenario review (2026-10-23)

Tested source: `b5cfaa2913003ce0728ab4bcabbb3c70d7c4b9eb`, rulebook template `1.7.0`, inventory template `1.0.0`, provenance schema `1`. The work package remained unchanged during verification. Each scenario used a separate disposable project and a native actor started with no inherited conversation (`fork_turns: none`), given only its task and permitted fictional project/incoming files. Actors did not receive expected invariants, observer metadata or development conversation. Runtime: Node.js `24.18.0`, Git `2.54.0.windows.1` on Windows.

The repository-only [preparation/review helper](../tests/exercises/independent-scenarios.mjs) builds inputs from the [versioned matrix](../tests/fixtures/session-handoff/scenarios.json), records pre-action path/SHA-256 inventories outside the actor project, and reports changes and copied-checker findings. The reviewer assessed produced files, canonical references, raw Git objects and source/time semantics in addition to actor reports. The helper does not launch actors or assign PASS automatically.

| Scenario | Result | Observed evidence |
| --- | --- | --- |
| `orphan-ambiguous` | PASS | No project changes; missing ownership/identity reported without an invented Draft. Checker exit `1` correctly exposes the seeded orphan. |
| `orphan-confirmed` | PASS | Only one owning Draft added; current/candidate/history bytes retained, version stays `1.0.0`, package fields not applicable, original creation time unknown. |
| `initialize-existing` | PASS | Only the correctly resolved product rulebook added; exact resolved-template comparison passed; baseline/provenance unchanged. |
| `interface-language` | PASS | Only existing Open items/Review notes changed; canonical description referenced without duplication, customer locale remains `en-US`, unobserved `zh-CN` field labels pending. |
| `submitted-no-confirmation` | PASS | No project changes; Submitted state, pending snapshot and absent go-live evidence preserved; no promotion or guessed events. |
| `listing-only` | PASS | Modern MSIX Desktop Logo candidate/inventory plus one Draft; supplied source/export bytes match, unrelated copy/release notes and current retained, visual/upload evidence pending. |
| `package-pending` | PASS | Candidate copy adds only the supplied title-sorting capability; Draft targets product `1.1.0`, exact package version/artifact/QA remain pending, current unchanged. |
| `review-fix` | PASS | Same record reopened Draft; only authorized Logo replacement/removal applied, original attempt/events/times retained and removed historical asset still retrievable. |
| `confirmed-promotion` | PASS | Three promoted files match the full original Git snapshot byte-for-byte, obsolete live asset and completed prep removed; original references and unknown submission/platform times retained. |
| `adapted-upgrade` | PASS | All 16 application-state file hashes and incoming copy unchanged; local extension/review rule/marker/generation evidence retained, unknown origin preserved, completed per-path merge recorded. |

All ten actors completed on their first execution: no actor retries, repaired outputs, FAIL or INCONCLUSIVE results. A reviewer comparison initially used the wrong pattern for the retained generation footer; correcting that assertion verified the original actor output without changing it or rerunning the scenario. All final copied-checker exits were `0` except the deliberately invalid ambiguous-orphan input. Remaining review findings were retained; scenario PASS does not mean submission readiness.

This is one execution set on the available native executor, not a reliability or cross-model study. Controlled project/incoming inventories do not establish global executor cache/log isolation. Shared-inventory promotion, repeat-publication history, other package/device variants and blocked-then-resumed upgrade variants retain their separate deterministic/artifact evidence; they were not additionally exercised by these actors. No real store upload, live-page observation, GitHub workflow run or downloaded release-asset verification occurred. Execution copies and per-run artifacts are disposable; only reusable inputs/helpers and this milestone conclusion belong in Git.

## 6. Decisions to settle during implementation

| Decision | Recommended starting position | Settle before |
| --- | --- | --- |
| First submission | Retain updates-only scope; consider separately | Any scope expansion |
| Record format and legacy fields | Implemented in template 1.4.0: readable attempt/event sections, explicit checkable path/status-note conventions, distinct date meanings and deliberate legacy handling | I.3 parser/tests implemented; custom/legacy gaps remain review findings |
| Snapshot timing and resubmission references | Implemented in I.2: approved full candidate commit precedes its record reference; retain every attempt, reverify before promotion, expose unavailable history | Selected independent review-fix/promotion scenarios passed; repeat-publication variants retain artifact evidence |
| Checker runtime and format | Delivered: one optional Node.js 22+ standard-library module, explicit root/store, text/JSON findings, exit 0/1/2, no writes or network retrieval | I.3 runtime decision settled; standalone tests passed on Node.js 24 / Git for Windows |
| Asset inventory location and shared assets | Implemented in I.4: Microsoft-specific per-locale/shared JSON inventories with owned Logo source/export directories, named language consumers, complete shared snapshots, and path-only rebasing; screenshot conventions retained | Deterministic/standalone checks and independent localized MSIX Logo preparation passed; shared variants retain deterministic evidence |
| Provenance storage | Implemented in I.5: kit-root provenance JSON, manual compare/merge guide, retained unknown origin/adaptations/history, staging-only release identity stamping | Artifact/stamping, standalone and independent adapted-upgrade checks passed |
| Test strategy and release gate | Focused deterministic and agent evidence; explicit handling of inconclusive runs | First behavioral change; release review |

I.6 settled the focused policy/scenario alignment in `docs/QA.md` and now has the selected independent execution evidence above. Broader Task G cost/reliability and release-gate evaluation remain open; this first execution set supplies no release exception.

## 7. Completion and follow-up

Each stage is complete only when its user-facing rules ship inside the standalone kit, applicable examples/checks demonstrate the behavior, and roadmap status matches the evidence. Do not mark an unrun scenario as passed.

The iteration was ready for merge review when all selected stages had their acceptance evidence, compatibility guidance, and a coherent package layout. It has since been merged into `main`. Tagging, publishing and actual release-asset verification remain separate actions. Existing roadmap Tasks D and H remain separate unless later selected explicitly. Task G is updated only for work actually completed.

Current review boundary: I.1-I.6 implementation, applicable deterministic/artifact checks and ten selected independent scenarios are merged into `main`. Additional executor/variant coverage, a future tagged package, actual release workflow execution and downloaded-asset inspection remain separate work; this iteration does not claim release readiness or a release exception.
