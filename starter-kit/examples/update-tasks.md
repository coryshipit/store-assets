# Update Task Examples

These fictional examples illustrate the workflow and generated rulebook. They are not Microsoft submission categories, live records, package verification, or upload-ready asset specifications. Do not copy their product facts into an application. Paths below are relative to the installed `store-assets/` folder.

## Listing-only Logo update

Northstar Notes is already published at application version `1.0.0`. The user confirms that only a store Logo changes. There is no new application package and no other active submission. The confirmed scope is `en-US`. Inspect existing candidate content before beginning.

Create the Draft first, then copy the complete `microsoft-store/current/en-US/` snapshot into `microsoft-store/release-prep/en-US/` and change only the agreed asset. Preserve listing fields, application release notes, and other assets. The illustrative Logo path below is not a required directory layout or an official size/format rule.

Example record path: `microsoft-store/submissions/2026-10-22-logo-refresh.md`.

```markdown
# Northstar Notes Microsoft Store Submission — 2026-10-22-logo-refresh

Submission ID: 2026-10-22-logo-refresh
Draft created date: 2026-10-22
Submission date:
Released application version: 1.0.0
Application version: 1.0.0
Update type: listing-only
New package version: Not applicable
Package evidence: Not applicable
Store submission ID: Pending — not reported by the store
Locales: en-US
Status: Draft
Publication date:
Publication confirmed date:

## Changes

- Replace the agreed store Logo candidate; retain application version 1.0.0.
- Preserve all other listing content, screenshots, and application release notes.

## Submitted files

Candidate paths, not proof of upload:
- microsoft-store/release-prep/en-US/listing.md — unchanged listing
- microsoft-store/release-prep/en-US/release-notes.md — unchanged application notes
- microsoft-store/release-prep/en-US/logos/store-logo.png — Logo candidate
- Other assets copied from the live snapshot remain part of the complete candidate.

## Open items

- Confirm the Logo's destination field/specifications and user visual review before readiness.

## Certification result

Not submitted.

## Review notes

- No new package is part of this task.
- current/en-US/ remains unchanged. Do not report this candidate as ready or live.
```

For brevity this task-type example omits the event/attempt sections now required by the rulebook. In an actual record, add the sourced draft-created event, leave Submission attempts explicitly unfrozen until approval, and add a verified snapshot before submission handoff. See [submission history](submission-history.md) for those formats.

The missing external submission ID does not prevent preparing this Draft. The unreviewed Logo does prevent claiming readiness. A later real submission follows the existing status workflow; a new local record is not evidence of store submission.

## Package update with missing evidence

The same published application has a confirmed target product version `1.1.0` and new release facts, but its package version, final artifact, and build/QA evidence have not been supplied. If listing changes accompany it, the type is still `package-update`.

Record the confirmed values and the gaps:

```text
Released application version: 1.0.0
Application version: 1.1.0
Update type: package-update
New package version: Pending — final package version not supplied
Package evidence: Pending — final artifact and build/QA evidence not supplied
Store submission ID: Pending — not reported by the store
Status: Draft
```

This is a partial field example, not a complete record. Use every field/section from the rulebook in the actual Draft and list the missing package facts in Open items. Prepare copy supported by confirmed facts; preserve the full snapshot and keep `current/` unchanged. Do not choose `1.1.0.0` merely because the product version is `1.1.0`, mark the package fields not applicable, or claim readiness. If even the target product version is unknown, record that as pending too; do not guess it or place a pending version into public release copy.

## Recover a Logo candidate without a Draft

If `release-prep/` already contains a Logo candidate, do not overwrite it with a fresh copy from `current/`.

1. Inspect candidate files and all records read-only. Empty directories and `.gitkeep` do not count as a candidate.
2. Find confirmed task identity, update type, current released version, locale/scope, and evidence of ownership. A matching locale alone is insufficient.
3. If the user confirms this is a separate listing-only update, no active record conflicts, and the required facts are known, create its independent Draft and reference the existing files. Preserve the files and record unreviewed/incomplete parts as open items.
4. Do not backdate submission events from file modification times or attach the new update to a historical Published/Withdrawn record. If it is a confirmed fix to a Rejected submission, reopen that existing record according to the workflow.
5. If ownership remains uncertain, ask for the missing facts and preserve the candidate. Association recovery is not proof that all assets are complete or approved.

## Continue an existing submission

If a Draft already owns the candidate and the task explicitly continues it, update that record and candidate. If another update is requested while it is active, report the conflict and wait for resolution instead of creating a second active submission. Do not auto-withdraw the existing one. For Submitted/In certification, track store events without editing the submitted assets; confirmed review fixes use the workflow's return-to-Draft path.

## Existing projects

These rules use template version `1.4.0`; that is not a toolkit release number. Compare the workflow/template changes with your generated rulebook and merge deliberately. Preserve local adaptations, current assets, candidates, and historical records. Do not regenerate a customized rulebook or relabel old records blindly. When resuming a legacy Draft, establish its type from actual task evidence, preserve any changed legacy label in Review notes, and add known fields or explicit gaps. Preserve ambiguous legacy dates with an interpretation note rather than silently treating them as platform timestamps. The [read-only checker](../checking.md) reports such gaps without migrating the record.
