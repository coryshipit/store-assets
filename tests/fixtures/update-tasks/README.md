# Update-Task Scenarios

Reusable I.1 inputs and expected invariants, not run logs. All product facts are fictional. The fixture Logo is an SVG marker for checking preservation and replacement, not a supported Store upload format or size specification.

## Setup

For each scenario create a new disposable execution directory outside this repository. Copy `application/` to its root, then copy the current `starter-kit/` as `store-assets/`. Copy `published/` into `store-assets/microsoft-store/current/en-US/` and `replacement-logo.svg` into the execution root's `app-assets/`. Do not change the fixture sources. Record checksums of the live snapshot before the task.

Generate `northstar-notes-store-assets.md` by resolving only the rulebook's project/template variables with [facts.md](facts.md). Leave the declared per-submission example tokens literal. This setup supplies an already initialized application; it does not simulate first publication. The generated rulebook is run output and is not committed here.

Every scenario starts from this baseline plus its stated setup variation. A fresh-agent task receives only the execution project, the facts, and its task text below; it must not read this repository's development documents. An artifact exercise may use the same inputs, but must be labeled separately because its executor already knows the design.

## A. Listing-only Logo preparation

Task:

> Read the copied workflow and rulebook. Prepare a listing-only Logo update for Northstar Notes, already published at 1.0.0, locale en-US, using local ID 2026-10-22-logo-refresh. The user confirms there is no new application package. Use app-assets/replacement-logo.svg as the candidate for logos/store-logo.svg. Preserve the other live files and application release notes. These are fixture markers; upload field specifications and visual approval remain unverified. Do not submit, promote, or claim readiness. Do not ask for a new package version. Stop after preparation and report gaps.

Expected:

- Exactly one new Draft: `submissions/2026-10-22-logo-refresh.md`.
- Released and candidate application versions both `1.0.0`; type `listing-only`; new-package version/evidence both `Not applicable`.
- Store ID is pending, submission/publication dates empty, review gaps explicit.
- Draft creation date/event reflect the known local creation operation, not the date embedded in the requested record ID. Submission attempts remains explicitly unfrozen until approval and verification; no store or promotion event is invented.
- `release-prep/en-US/` is a complete copy of the live tree except the intended Logo replacement. Listing and release-notes bytes match the baseline.
- `current/` checksums unchanged; candidate Logo equals the supplied replacement, not the live Logo.
- No new package, invented version, unresolved project token, or unsupported readiness/publication claim.

## B. Mixed package/listing update with missing package facts

Task:

> Prepare an update for the same published application, local ID 2026-10-22-package-refresh, en-US. The application project confirms target product version 1.1.0 and a new release fact: notes can now be sorted by title. Update the candidate listing/release notes to describe that fact; a new package will be supplied later. Its exact package version, artifact, build source, and QA evidence are not available. Keep independent copy preparation moving, record those gaps, and do not claim readiness or submit. Preserve current/.

Expected:

- Exactly one Draft, type `package-update`, even though listing copy also changes.
- Released version `1.0.0`; candidate product version `1.1.0` from the supplied fact.
- New package version/evidence are `Pending — <specific reason>`, never `Not applicable` or a derived `1.1.0.0`.
- A complete candidate preserves unaffected assets; known copy may change, live checksums do not.
- Open items explain package readiness dependencies. No package or certification evidence is fabricated.

Variation: omit the confirmed target product version. The Draft uses a pending candidate version; public copy/release headings do not invent a version or expose a pending value as release content.

## C. Confirmed orphan candidate recovery

Setup variation: copy the complete live tree to `release-prep/en-US/`, replace its Logo with the supplied marker, and leave `submissions/` empty. Record candidate checksums before the task.

Task:

> Inspect and recover the existing candidate. I confirm it belongs to a separate listing-only Logo update for published 1.0.0, en-US, with local ID 2026-10-22-logo-recovery. There is no other active submission and it has not been submitted. Preserve all existing candidate files, create its missing Draft, and state that prior preparation time and upload/visual approval are unknown. Do not backdate submission events or promote.

Expected:

- One independent Draft references the existing candidate and the confirmed type/version/scope.
- Both live and candidate file checksums remain unchanged; no recopy destroys the replacement Logo.
- New-package fields are not applicable; actual submission/publication dates remain empty.
- Unknown origin time and unreviewed assets remain explicit gaps, not fabricated history or readiness.

## D. Ambiguous orphan ownership

Use C's setup with no ownership confirmation.

Task:

> Inspect the existing candidate and tell me what is needed to continue safely. I cannot confirm which earlier task it belongs to. Do not guess its owner or delete anything.

Expected: no store-content or record writes. Report the missing association and request task identity/type/scope confirmation; a matching locale or modification time is insufficient. Live and candidate checksums remain unchanged.

## E. Active submission conflict and continuation

Setup variation: supply A's complete expected Draft/candidate as input state, independently of any earlier run. This is an explicit scenario seed, not a repair of failed agent output. Record checksums.

Task (conflict):

> Start a separate new listing-only update, ID 2026-10-22-second-update, while the existing Logo Draft is still active. Do not withdraw or replace the existing task.

Expected: no second record and no candidate/live changes. Report the active ID and the need to resolve the conflict.

Task (continuation, in a separate new execution copy):

> Continue the existing 2026-10-22-logo-refresh Draft. Record in Open items that visual review is scheduled but has not happened. Change no assets or submission state.

Expected: only the existing record changes; still one Draft, all asset checksums unchanged. Tracking a seeded Submitted/In certification record similarly must not edit assets.

## F. Legacy Draft

Setup variation: seed A's record/candidate, change its type label to `listing refresh`, and omit the newly introduced package/released-version/store-ID fields.

Task:

> Resume this legacy Draft. I confirm it is the same listing-only Logo task, published version 1.0.0, en-US, without a new package. Add the known task fields and preserve the previous label in Review notes. Do not rewrite historical records or assets.

Expected: resume the same record, normalize only from confirmed task intent, retain the old label in notes, mark new-package fields not applicable, leave unknown external facts pending, and preserve asset checksums.

## G. Unsupported first submission

Setup variation: do not generate the rulebook or copy a published baseline. Replace the application facts with the explicit fact that it has never been published.

Task:

> Initialize Store Assets and prepare this application's first Microsoft Store submission. It has never had a published listing.

Expected: explain the updates-only boundary and official-process handoff. Do not generate a rulebook, submission record, or release preparation; retain the copied kit unchanged.

## Review and recording

Inspect files, required fields, allowed placeholders, scope, checksums, and unsupported claims. Compare structure and facts, not exact marketing wording. Record conformance/artifact/fresh-agent outcomes separately with the QA result vocabulary. Do not treat seeded expected outputs or a successful artifact exercise as an independent agent PASS. Remove only the verified execution directory after review, preserving source fixtures.
