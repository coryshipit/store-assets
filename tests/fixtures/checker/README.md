# Read-Only Checker Scenarios

The executable scenarios live in `tests/check-store-assets.test.mjs`. They copy the standalone kit and reuse the fictional Northstar Notes published baseline from `../update-tasks/`. Record fields, attempts, events, faults, and expected findings are constructed explicitly in that test file; there are no real accounts or product claims and no committed run outputs.

Run from the repository root with Node.js 22+ and Git supporting `--no-lazy-fetch`:

```text
node --test --test-reporter=spec tests/check-store-assets.test.mjs
```

Every case uses an isolated OS-temporary project. Local Git cases use a fictional identity, suppress commit hooks/signing, and create only disposable commits/clones. The shallow-clone case uses a local file URL, not an external remote. Cleanup verifies that recursive removal stays inside the declared temporary project. No test stages, commits, fetches, or rewrites this Store Assets repository.

## Core cases

| Input or change | Expected evidence |
| --- | --- |
| Unused kit, empty candidate, reserved adapters | No orphan or invented store rules |
| Complete listing-only candidate and Draft | No new package needed, unfrozen attempt allowed |
| Candidate without a Draft, two active records, conflicting archive | Locatable ownership/count findings |
| Missing field/image/link, invalid status, locale mismatch, project token | Error with file/line/code |
| Pending package/target evidence | Review item, no fabricated version or structural rejection solely for being pending |
| Planned addition/removal, declared shared asset | No forced equality with old current/ or invented locale |
| Legacy/unparseable history, source-template drift | Review gaps, retained bytes, no automatic migration |
| Full SHA-1/SHA-256 snapshot, stored path, complete locale scope | Reference validation at the recorded commit |
| Current-tree historical reference, removed working prep, old Markdown link | Use the stored tree, never today's current/ as historical proof |
| Dirty frozen content, extra untracked/ignored file | Detect mismatch without executing Git filters or refreshing the index |
| Git text normalization, configured clean filter | Limited normalization; filters never run, unsupported comparison reviewed |
| Missing Git, missing shallow object, invalid invocation, symlink/junction | Incomplete/input result distinct from structural errors; no silent fetch or traversal |
| Missing go-live confirmation, invalid local reopen, date borrowed from observation | Structured event/summary findings without invented external states |
| Newly approved Draft attempt, unknown latest published-attempt identity | Compare the correct new snapshot or report unknown binding; never fall back to an older convenient attempt |
| Unknown platform time with explicit user confirmation | Published and confirmation date may coexist with an empty platform date |
| Copied script invoked from outside its project | CLI works without repository-only modules or npm packages |

## Read-only evidence

Positive, negative, legacy, Git, and copied-CLI cases compare file-path/content-hash inventories before and after checking. Git cases include `.git/index`, object files, and configuration in that inventory. Symlinks are represented as links rather than followed by the inventory helper. Empty status alone is not the proof of read-only operation.

These tests exercise the actual checker implementation. They do not replace the separate fresh-agent scenarios for instruction reliability, actual downloaded release-asset verification, human evidence review, or a real store action. A report with exit 0 may deliberately contain review findings and must not be called submission-ready.
