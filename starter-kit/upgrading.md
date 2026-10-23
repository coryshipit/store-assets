# Kit provenance and manual upgrades

Use this guide to identify an installed kit's upstream source, preserve local adaptations, and merge a newer kit. An upgrade changes toolkit files and deliberately merged rules; it is separate from preparing, submitting, or promoting an application update.

## One provenance record

The kit-root [provenance.json](provenance.json) is the installed project's record. Keep it in the application repository. Read it alongside the actual files and Git history; it is a record of evidence, not proof that every installed file is unmodified.

| Field | Meaning |
| --- | --- |
| `schema_version` | Provenance format version, currently `1` |
| `upstream.repository` | Repository supplying the most recently fully integrated upstream kit, or `Unknown` |
| `upstream.release` | Its verified toolkit release/tag, or `Unknown`; a source checkout can have a known commit without a release |
| `upstream.commit` | Full upstream source commit ID when established, or `Unknown`; not the application repository's current commit |
| `upstream.template_versions` | Map from template path to its upstream version or `Unknown`; keep rulebook and Microsoft inventory template versions separate |
| `upstream.evidence` | Where that identity came from and its limits, e.g. retained archive, source checkout, confirmed prior record, or unknown origin |
| `local_adaptations` | Array of `{id, paths, description, reason, evidence}`; stable local IDs, kit-relative paths, what/why changed, and source/date or explicit unknowns |
| `upgrade_history` | Append-only array of `{id, recorded_at, from, to, status, changes, conflicts, verification}`; `from`/`to` are full upstream objects in the shape above |

An upgrade entry's `status` is `planned`, `in-progress`, `blocked`, `completed`, or `abandoned`. `changes` is an array of `{path, action, reason}` with explicit replace/add/merge/retain decisions. `conflicts` is an array of `{path, issue, resolution}`; a missing decision uses `Pending — reason`. `verification` records the actually performed checks and remaining limitations. `recorded_at` is the known recording date/time with precision/offset where available, or `Unknown`; do not invent historical timestamps. Preserve old conflict text when adding its eventual resolution.

The top-level `upstream` remains the previous fully integrated source until all selected upstream changes have been reviewed, merged or explicitly accounted for as local adaptations, and applicable verification is complete. A blocked or abandoned upgrade keeps its previous value. On completion, copy the target into `upstream` and preserve the prior source, including unknown values, in that history entry. Keep intentionally retained upstream differences in `local_adaptations`; a completed upgrade does not imply byte equality with upstream. Never replace this record with a fresh download's empty arrays.

Toolkit release, template version, locally edited version marker, application version, and package version are distinct. A locally incremented marker does not establish the original upstream template version or downloaded release. The source kit ships unknown release/commit defaults. Tagged release builds stamp the archive's copied record with their actual repository/tag/source commit and template markers. This identifies the source used for the build; the stamped record itself need not exist with those values in that source commit. Verify the download/source identity against retained evidence before trusting its metadata.

For a legacy project with no record, create this JSON shape with **all unestablished upstream values**, including template versions, set to `Unknown`, and explain the available evidence. Use the two template paths above as keys only when those templates exist. Record observed local markers in adaptation evidence; do not backfill them as verified upstream versions. Inspect existing customizations before leaving `local_adaptations` empty. If their extent is uncertain, add an adaptation covering the unreviewed paths with that limitation. Unknown origin does not prevent comparison/preparation; it limits what can be claimed about upstream changes.

## Which files an upgrade may change

All paths below are relative to the installed kit root. First compare **every incoming path** with this ownership table; a familiar filename alone does not authorize overwrite.

| Ownership | Examples | Upgrade treatment |
| --- | --- | --- |
| Shipped toolkit files | `README.md`, `store-assets-workflow.md`, `checking.md`, `upgrading.md`, `scripts/`, `examples/`, `microsoft-store/asset-rules.md`, package/store `templates/` | Compare old upstream, installed file, and incoming upstream when the old source exists. Replace only a reviewed unmodified shipped file; merge adapted files deliberately. Add new files only when their target paths do not already hold user content. A removed upstream path is a review item, never an instruction to recursively delete a folder. |
| Generated product rules | `<product>-store-assets.md` and any local rule extensions | Merge applicable template changes into existing rules. A newly resolved rulebook may be generated in the separate review area for comparison only. Preserve local sections, constraints, project facts, and the truthful generation marker/history. Do not regenerate over the installed rulebook. |
| Application-owned state | Every store's `current/`, `release-prep/`, `submissions/`, sources, exports, inventories, records, immutable attempt references | Preserve their paths and bytes during the toolkit upgrade, including `.gitkeep`. Record separately needed content/record migrations as pending application work. Do not rewrite old records, rebase inventories, promote, clear a candidate, change its status, or fabricate missing evidence to make new checks pass. |
| Installed provenance | `provenance.json` | Merge evidence and append upgrade history; retain adaptations and prior source identities. |
| Unclassified/local content | Extra files, local templates, reserved-adapter extensions, files colliding with new upstream paths | Preserve and classify. Resolve conflicts before a dependent replacement; record retained customization explicitly. |

Local first-submission support, Apple/Google rules, or other project extensions remain **local adaptations**. Preserve them through the merge without claiming upstream supports or has verified them. Do not execute an out-of-scope local workflow merely because the upstream kit was upgraded.

## Compare and merge

1. **Read and inventory the installed project.** Read its workflow, product rules, provenance if present, and local instructions. Identify active/pending-promotion submissions and candidate content. Inventory relevant file paths, dirty/untracked/ignored files, and content hashes before edits. Preserve a recoverable copy or the application's normal Git baseline without staging unrelated work, resetting the tree, initializing Git, or pushing just to obtain one. If the affected files cannot be protected, stop their replacement and report the gap; independent comparison may continue.
2. **Prepare a separate incoming/review copy.** Use an identified downloaded kit or source supplied for this task. Unpack outside the installed `store-assets/`; retain its provenance as input evidence. Never unzip or copy the whole newer folder on top of the installed kit. Record the target source and `planned`/`in-progress` history before applying changes. Missing authentication/download/origin evidence stays unknown; ask only for a fact or decision that blocks a dependent change.
3. **Compare per path.** With a retained old source, compare old→local for adaptations and old→incoming for upstream changes. Treat the build-stamped provenance as metadata, not an exact copy of the source-commit file. Without the old source, compare local→incoming and label attribution uncertain; do not call either side an unchanged upstream file. Preserve local content until the difference is understood. Include files modified locally but not listed in provenance. A conflict remains `blocked` for the dependent change until resolved; independent reviewed changes may proceed if the partial state is recorded.
4. **Apply the reviewed change list.** Replace/add only the selected shipped paths; merge local tool/workflow/template adaptations and the generated rules intentionally. Keep upstream template markers and local marker changes distinguishable in provenance. Do not merely relabel an old generated rulebook as the new template version to silence drift. Record integrated template changes and retained differences; a truthful version-drift finding can remain pending review. Apply no application-state migration as part of this toolkit operation.
5. **Check the result and preserved state.** Review merged rules for lost local constraints, pending conflicts, unresolved project tokens, and broken references. Confirm application-state path/hash inventories and existing attempt references are unchanged and still resolvable when history is available. Run the optional checker with the new kit when its runtime is available, treating findings as evidence of separate gaps rather than authorization to rewrite records. Inspect the diff for writes outside the reviewed scope. Checker exit `0` does not establish origin authenticity, upgrade completeness, visual approval, or readiness. If checks cannot finish, retain the actual partial state and pending verification; do not mark the upgrade completed.
6. **Record the actual outcome.** Append the paths/actions, conflict decisions, preserved adaptations, checks/results and remaining limits in the same history entry. Complete the upgrade and advance top-level `upstream` only after the chosen upstream changes and retained local deviations are accounted for. Otherwise keep it `in-progress`/`blocked`; on abandonment retain what was attempted and any deliberate rollback, without erasing unrelated edits. Resume from these files in a later session.

## Compatibility review for the current format

| Earlier format/gap | Toolkit upgrade action | Separate application task, when needed |
| --- | --- | --- |
| No provenance; local template marker changed | Establish unknown origin with observed local evidence and adaptations | Investigate retained source/download history if available; never guess a release |
| I.1 fields missing or old task labels | Merge task-type/version/Draft recovery rules | Reconcile an active record only from confirmed intent/evidence; preserve historical labels in notes |
| I.2 attempt/event/date gaps | Merge immutable snapshot and time semantics | Retain old dates, unknown identities and earlier attempts; obtain real evidence without substituting HEAD/current files |
| I.3 checker absent or older parsing | Add/merge the checker and guide; report its errors/review/incomplete outcomes | Resolve candidate ownership and unsupported/legacy formats deliberately; no automatic repair |
| I.4 Logo inventory missing | Add role rules/template/example, preserve screenshots and local sources | Add a real source/export/consumer inventory for new/revised Logo work; do not bulk migrate or invent old mappings |

An active Draft may remain active with its existing gaps throughout this upgrade. A Submitted/In certification snapshot must retain its exact candidate bytes. Conflicting local rules or new checker findings can block the next dependent submission action; they do not authorize changing frozen content. See [the fictional upgrade example](examples/manual-upgrade.md).
