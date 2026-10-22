# Submission-History Scenarios

Reusable I.2 facts and assertions. All store events and product facts are fictional; no real application, account, upload, or live page is used. Reuse the I.1 application and published assets from `../update-tasks/` as the baseline.

## Repeatable artifact exercise

From the repository root run:

```powershell
powershell -NoProfile -File tests/exercises/submission-history.ps1
```

Requires Git and PowerShell 5.1 or later. The exercise copies only the standalone kit and synthetic fixture inputs into a new directory under the operating-system temporary directory. It initializes/commits/clones only those disposable repositories, uses a fictional local Git identity, never contacts an external remote, and removes its verified execution directory on completion. It does not stage, commit, or change this Store Assets repository. Sources and assertions remain versioned; run outputs/logs are not committed.

The script constructs known artifacts and invokes Git to exercise the reference contract. It is not a fresh-agent test, does not prove an agent will follow the instructions, and is not the planned I.3 validator. It prints independent assertions and fails if one does not hold.

## A. Rejection, correction, and first promotion

Input: published Northstar Notes `1.0.0`, `en-US`, no new package, and explicit fictional approval/submit/review/go-live reports from [facts.md](facts.md).

Task for a fresh agent:

> Read the copied workflow and generated rulebook. Prepare the confirmed listing-only Logo candidate, keeping current/ unchanged. Freeze the complete approved candidate and record Attempt 1. The supplied report confirms it was submitted, but does not establish its actual submission time. Then apply the supplied rejection/fix facts, reopen the same record as Draft, freeze corrected content as Attempt 2, and record the second submission with its date-only evidence. After explicit confirmation that Attempt 2 is live, promote exactly that snapshot, retaining both attempts and all event evidence. Do not invent a platform publication timestamp. Operate only within this disposable fixture project; commits of these fixture assets/records are authorized, pushes are not.

Assertions:

- Current hashes stay unchanged throughout preparation and fixes.
- Attempt 1 and Attempt 2 store full resolved commit IDs and complete repository-relative candidate tree paths.
- Asset commits precede the referencing record commit; verification does not require that record in the asset commit.
- Corrected assets and intended removal are captured in Attempt 2 without rebinding Attempt 1.
- Explicit go-live produces Published and a confirmation date, with an empty platform publication date.
- Promotion copies exactly Attempt 2, removes stale live files and completed prep, and adds a local promoted event.

## B. Another publication and historical lookup

Input: A's completed published state as a declared scenario seed, plus a distinct second approved Logo update. Use a new execution copy for an independent agent test; do not repair a prior failed run and then call it passing.

Task: prepare, freeze, record actual submission/go-live, and promote the second update. Retrieve both attempts from the first record using their full IDs and original paths.

Assertions: current/ changes to the new snapshot; both earlier asset trees still resolve with their earlier bytes, including an asset removed in the correction. The first record keeps its original attempt references. Do not substitute today's current/ or HEAD for those paths.

## C. Snapshot gaps and changed content

Test separate disposable states:

- Change a tracked candidate after its snapshot commit: the candidate no longer matches; preserve the old reference and report a pending mismatch, without promoting.
- Add an intended untracked file, then an ignored file: tracked diff alone may be empty; status including ignored/untracked files exposes the omission.
- Inspect a shallow copy without the old snapshot objects: preserve the reference and report verification pending; do not replace it with shallow HEAD. When an object is available, shallowness alone is not failure.
- Copy the kit outside Git: Draft preparation remains possible, snapshot readiness stays pending. Do not silently initialize a real user's repository.
- Receive an actual submission or explicit go-live report while the old snapshot is unavailable: record the true reported external event/status and an archive gap; preserve candidate content and omit promoted.

These are failure inputs, not permission to modify the real application or its history.

## D. Time precision, late reports, and legacy dates

Assertions from the supplied facts:

- A reported submission with unknown occurrence has Unknown occurrence and known observation/recording times; its filename date is not used as the actual submission date.
- A date-only second submission preserves date precision and source timezone instead of fabricating midnight.
- User go-live receipt and later local promotion do not fill the unknown platform publication date.
- Later date-only platform evidence can fill that date while preserving the earlier confirmation event and its distinct observation/recording times.
- A legacy date remains unchanged with a note that its meaning is unknown; no occurrence or original observation time is retroactively invented.

## Evidence recording

Report conformance, constructed-artifact results, and fresh-agent results separately under `docs/QA.md`. A deterministic artifact PASS is not an independent behavior PASS or a real release-asset check. Store only reusable fixtures/mechanisms and confirmed conclusions in the repository.
