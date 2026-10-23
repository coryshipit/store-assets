# Fictional session startup and handoff

These Northstar Notes examples use fictional facts/observations, not evidence of an actual Partner Center field, upload or publication. Follow [workflow §§1.3–1.4 and §5](../store-assets-workflow.md) and the generated product rules.

## A fresh session finds an orphan Logo candidate

Request: "Continue the store task."

Saved files show a published `1.0.0` baseline and nonempty `microsoft-store/release-prep/en-US/`, including a Logo. No active record owns it. Its creation time, task identity and approval are not established.

Inspect actual records/candidates and run the optional checker when available. `ORPHAN_CANDIDATE` locates a missing association; it supplies no ID or approval and no permission to overwrite. A suitable read-only handoff is:

> The `en-US` candidate has no owning Draft. Current and candidate files were preserved. The checker reports `ORPHAN_CANDIDATE` at candidate paths. Task ID/type/version/scope need confirmation before association; source/visual/upload evidence is unverified. Next: establish whether this is a separate listing-only update or an existing record's work, then recover its association.

If a subsequent request explicitly establishes a separate listing-only update, ID `2026-10-23-logo-refresh`, released application `1.0.0`, locale `en-US`, and no new package, and files show no active/archive conflict, create that one Draft referencing the preserved candidate. Keep application version `1.0.0` and new-package fields `Not applicable`. Do not recopy the candidate, infer old file-creation times or pretend a synthetic Logo has a verified upload role. Record pending source/role/visual review and its next required evidence in Open items; put check scope/continuation in Review notes.

## Interface and customer languages differ

Suppose supplied fictional evidence says the operator's interface is `zh-CN` while this task edits the `en-US` listing. Its canonical description remains in `microsoft-store/release-prep/en-US/listing.md` under Product description; its Logo field/export consumer belongs in the relevant inventory.

The existing submission Review notes can use this shape after actual evidence is supplied:

```text
### Field handoff
Interface language: zh-CN
Customer locales: en-US
Observed field/section: [actual observed label; pending if not observed]
Canonical destination: [verified section/field]
Value source: microsoft-store/release-prep/en-US/listing.md#product-description
Source and reviewed date: [actual source and known date]
Limit: interface label pending verification; canonical copy remains at Value source.
```

This references the canonical copy. It does not change `Locales: en-US`, create a `zh-CN` candidate or prove upload. For Logos use [Microsoft asset rules](../microsoft-store/asset-rules.md) and identify the inventory entry; package-icon names do not establish listing roles.

## Preparation is not publication confirmation

Request: "Continue and finish." Saved state is Submitted/In certification with a frozen attempt and no explicit go-live confirmation. Inspect the recorded attempt and outstanding store evidence. Do not edit frozen images, reopen Draft, open a second active submission or promote current from this request alone. Name the needed confirmation source and preserve unknown platform publication time. An explicit actual go-live report for the identified attempt permits the separate promotion procedure; local file approval does not.

## The next session can continue

The next agent reads ID/type/version fields, Submitted files, Open items and Review notes, then checks the real files again. A chat summary is useful navigation; if it conflicts with saved status, source objects or asset bytes, report and reconcile the discrepancy. Known gaps do not stop independent work. No `handoff.md`, separate status dashboard or duplicate listing description is required.
