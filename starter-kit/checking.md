# Read-Only Structural Checks

The optional checker reports structural errors, evidence needing review, and informational findings for the Microsoft Store work package. It never repairs files, fills facts, stages changes, or changes submission status.

## Run

Requires Node.js 22 or later. It uses the Node.js standard library only; no npm install or package manifest is needed. Git with support for `--no-lazy-fetch` is required when actual snapshot IDs need inspection; an unfrozen Draft or unused kit can be checked without Git. Unsupported/missing Git is reported separately from invalid content.

From the application repository root:

```text
node store-assets/scripts/check-store-assets.mjs --root store-assets
```

From inside the work package:

```text
node scripts/check-store-assets.mjs --root . --store microsoft-store --json
```

Always select the copied work-package root explicitly. The root must contain its static README, workflow, and rulebook template. Apple/Google are reserved adapters; selecting them returns an input error. The checker neither interprets their schemas nor scans their content.

## Results

| Finding | Meaning |
| --- | --- |
| `ERROR` | A structural inconsistency needs a concrete repair, such as an orphan candidate, conflicting records, missing file, or invalid field |
| `REVIEW` | Evidence/applicability needs attention: pending package facts, legacy history, open items, source drift, or an interpretation the script cannot safely make |
| `INFO` | Context such as an unused kit with no active work |

Every finding includes a stable code, path, line, and explanation. Representative codes include `ORPHAN_CANDIDATE`, `MULTIPLE_ACTIVE`, `PACKAGE_APPLICABILITY`, `FILE_MISSING`, `LOCALE_SCOPE`, `UNRESOLVED_TOKEN`, `SNAPSHOT_PATH_MISSING`, and `DATE_SOURCE`. Review the identified file and the workflow before repairing it. Re-run afterward; no repair option is provided.

| Exit code | Meaning |
| --- | --- |
| `0` | Checks completed without structural errors; review items may still exist |
| `1` | Checks completed and found structural errors |
| `2` | Invalid invocation/root/adapter, unavailable Git/history needed by a check, a filesystem limitation, or another inability to complete checks |

Code 2 takes precedence if incomplete checks and structural errors coexist. A zero exit code is not submission readiness, proof of approval/upload/publication, or permission to change live assets. A deliberately partial Draft can have pending facts or incomplete-file findings; keep the work visible instead of inventing facts to obtain zero errors.

`--json` writes a versioned report to stdout: `schema_version`, `exit_code`, `counts` (`error`, `review`, `info`), and `findings` (`level`, `code`, `path`, `line`, `message`). Completed-root reports also include `root` and `store`. Input argument failures use code `INPUT_ARGUMENT`. Reports are not written into the application.

## Record format understood by the checker

- Keep the readable field/section headings from rulebook §6. Fields are single `Name: value` lines outside code fences. Duplicate fields/headings are ambiguous. Extra local sections are retained and ignored rather than rewritten.
- Canonical I.2 records have both `Submission attempts` and `Events`; their required fields/sections are checked. Older/unstructured records receive `LEGACY_RECORD` review items. Known invalid values can still be errors; missing old facts are not fabricated or automatically migrated.
- In `Submitted files`, use one bullet with a backtick-quoted kit-relative path or a Markdown link per reference. Bare legacy paths without spaces are also recognized. A directory reference explicitly covers its descendants. For a complete locale, referencing its candidate tree or files under that declared locale establishes only structural association, not verified ownership/approval.
- Snapshot paths are separate: they are relative to the application Git root. Record full commit IDs and complete affected trees; a single changed image does not cover a locale. Paths outside the selected store need manual review and are not scanned as a new adapter/schema.
- In `status-observed` events, use `Notes: Status: In certification; source limitations` (or another documented status). The script checks structured local transitions, confirmation before promotion, and event/date summaries. Gaps or unstructured external observations are reviewed without inventing intermediate states. Correction events need manual interpretation.
- Templates retain their tokens. Generated rulebooks may retain the declared per-submission tokens in policy declarations, fenced examples/skeletons, and explicit inline heading examples in Naming rules. Actual listing/submission files may not retain unresolved tokens.

Examples of file references:

```text
## Submitted files

- `microsoft-store/release-prep/en-US` — complete affected locale candidate
- `microsoft-store/release-prep/logos/store-logo.png` — explicitly included shared asset
```

This old arbitrary shared path illustrates association only. For new/revised Logos, use the actual owned locale or `shared/` tree with `asset-inventory.json` described in [Microsoft asset rules](microsoft-store/asset-rules.md); include its complete scope in the record and frozen attempt.

## Scope and limits

The checker covers active counts, candidate/record association, required fields, known statuses, task/locale applicability, required locale files, local links, tokens, source-template markers, attempt references, structured events, and date summaries. Intentional candidate additions/removals are allowed; it does not require equality with the previous live tree. A submitted or pending-promotion candidate is compared against its recorded frozen assets; a reopened Draft can differ while a new snapshot is pending.

For `current/` and `release-prep/` inventories, it also checks JSON structure, source/export paths and files, unique role/language assignments, record consumer/scope coverage, declared metadata, PNG header dimensions, and verified MSIX app-tile constraints. MSI/EXE box/poster aspect ratios follow the named roles; numeric dimensions/encoding/file-limit acceptance needs upload-field review. Missing legacy inventories, unsupported roles/profiles, pending facts, and visual evidence are review findings. An explicit inventory makes unlisted owned exports errors. Empty `assets` is allowed for a recorded last-export removal. See [the inventory contract](microsoft-store/asset-rules.md).

Historical inventory source/export references resolve within their stored attempt. Historical metadata and PNG technical rules are not revalidated against today's profile; inspect those at their original commit when needed. Current path rebasing at promotion does not rewrite that history. The checker reads PNG signature/IHDR only; it does not decode pixels, validate image integrity/alpha, verify permissions, authenticate approval, or prove remote upload/live rendering.

Kit-origin identity, `provenance.json`, retained local adaptations and upgrade-conflict decisions are reviewed manually under [upgrading.md](upgrading.md). The checker does not authenticate or validate that provenance record or declare an upgrade complete. A generated/source `RULEBOOK_VERSION` difference can be an intentional local adaptation: compare and document it instead of regenerating or relabeling rules to silence the finding.

Historical references are checked in their recorded commits, not today's `current/`. Shallow/partial checkouts missing required objects produce incomplete results; existing references are retained and no fetch occurs. LFS pointers, submodules, filters/encodings, unstructured provenance, and large historical Markdown link sets require explicit review. Limited Git text normalization is accounted for without executing content filters; upload binary bytes remain distinct from Git's normalized text representation.

Only kit content, its referenced local Git metadata/objects, and literal selected-store snapshot paths are read. Git optional index-refresh locks and lazy fetch are disabled; no external diff, fsmonitor, clean/smudge filter, or repair command is run. Filesystem symlinks/junctions are not followed and produce incomplete findings. Malformed/unavailable data remains visible rather than being treated as passing.

The script cannot determine product truth, legal/marketing accuracy, official image requirements, visual clarity, external evidence authenticity, or completeness beyond the documented structural rules. Continue the human ready checklist and official store workflow. A separate fresh-agent scenario is still needed to assess whether instructions reliably drive agent behavior.
