# DirPilot Feedback Iteration Plan

Date: 2026-10-22

Branch: `iteration/dirpilot-feedback`

Status: plan accepted on 2026-10-22; I.1 rules/examples implemented, independent behavior verification pending

## 1. Purpose and evidence

Improve the existing Microsoft Store update workflow using the DirPilot usage review dated 2026-10-22. The maintainer supplied `store-assets-dirpilot-usage-feedback-2026-10-22.md` from the protected, local-only `reference/` directory. This plan summarizes the relevant findings so development does not depend on that local file or conversation history.

The review reports that separating live and candidate assets, recording submissions, and waiting for explicit go-live confirmation were useful. It also reports an actual omission: a Logo update candidate was created without its own Draft record. Other gaps concern version applicability, asset roles, historical references, dates, local adaptations, and session handoff. The underlying DirPilot repository has not been independently audited for this iteration.

The maintainer accepted the staged plan on 2026-10-22 and authorized starting I.1. This does not approve every suggestion or finalize later schemas. Work proceeds one stage at a time, with a concrete change and verification result reviewed before the next stage.

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
2. Define the input root/store, write scope (none), findings, failure modes, and runtime requirements. Proposed delivery is one portable Python 3 standard-library script under `starter-kit/`, with an explicit input path; finalize its filename and supported runtime after the contract review. No installation service or automatic repair is needed.
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

## 6. Decisions to settle during implementation

| Decision | Recommended starting position | Settle before |
| --- | --- | --- |
| First submission | Retain updates-only scope; consider separately | Any scope expansion |
| Record format and legacy fields | Extend the current readable record minimally; document compatibility | I.1/I.2 acceptance and checker implementation |
| Snapshot timing and resubmission references | Commit approved asset content before referencing it; preserve each submitted attempt | I.2 acceptance |
| Checker runtime and format | One optional Python 3 standard-library script with explicit input and no writes | I.3 implementation |
| Asset inventory location and shared assets | Decide from verified Microsoft roles; preserve screenshot conventions | I.4 implementation |
| Provenance storage | One compact origin/adaptation record; unknown is allowed | I.5 implementation |
| Test strategy and release gate | Focused deterministic and agent evidence; explicit handling of inconclusive runs | First behavioral change; release review |

## 7. Completion and follow-up

Each stage is complete only when its user-facing rules ship inside the standalone kit, applicable examples/checks demonstrate the behavior, and roadmap status matches the evidence. Do not mark an unrun scenario as passed.

The iteration is ready for merge review when all selected stages have their acceptance evidence, compatibility guidance, and a coherent package layout. Tagging, publishing, pushing, and merging are separate actions and are not part of this planning task. Existing roadmap Tasks D and H remain separate unless later selected explicitly. Task G is updated only for work actually completed.
