# Submission History Examples

These fictional Northstar Notes examples explain immutable asset references and event dates. They are illustrations, not actual store events or runnable records. Use the generated rulebook's full format in an application.

## Freeze assets, then reference them

After a complete `en-US` Logo candidate is approved:

1. Commit the approved `store-assets/microsoft-store/release-prep/en-US/` tree under the application's normal Git rules. Keep unrelated work out of that commit. The submission record can remain uncommitted at this point.
2. Resolve the resulting full commit ID and verify the stored tree and candidate match, including checks for untracked/ignored files. For an existing matching commit, reuse its resolved ID; do not require a new commit just to change a date or record note.
3. Write the ID, root-relative tree path, approval source, verification result, and actual verification time into Attempt 1. Add the record in a later commit if desired. The asset commit does not need to contain its own referencing record.

The attempt format is shown schematically below; replace the descriptive values with actual evidence, or use the rulebook's explicit pending values:

```text
### Attempt 1
Snapshot commit: full commit object ID returned by Git
Snapshot paths:
- store-assets/microsoft-store/release-prep/en-US
Approval source: dated user approval of this complete candidate
Snapshot verification: Verified
Verified at: actual verification timestamp with UTC offset
```

That path is relative to the application Git root, even if commands were started inside the kit. It is not relative to the submission Markdown file. After publication, the working `release-prep/en-US/` may be removed; the same path at the recorded commit remains the historical location. A link to today's `current/en-US/` is only a convenience.

To inspect history, run Git from the application root, passing the resolved full ID and literal recorded path as separate quoted arguments. For example, `git show "<full-commit-id>:store-assets/microsoft-store/release-prep/en-US/listing.md"` reads the listing at that snapshot. Confirm object/path availability and enumerate the complete tree, not just one file. Keep the commit reachable in retained project history; an unreachable object may later disappear.

## Fixes and resubmission keep both attempts

Suppose Attempt 1 was actually submitted, then returned for corrections. Record its submitted/status events, reopen the same record as Draft, and fix the existing candidate. After review, freeze the corrected complete tree as Attempt 2. Keep Attempt 1's ID/path unchanged. Record the later actual submission against Attempt 2; do not create a second active submission record for those review fixes.

An approved attempt that was never submitted remains an approval/snapshot entry without a submitted event. If the user submits the same verified content again, record a distinct attempt/submitted event; the commit ID may be shared when content and scope are genuinely unchanged.

When the user confirms Attempt 2 is live, verify that snapshot again before replacing `current/en-US/`. If the working candidate has later edits, do not promote those edits. Preserve them and inspect an isolated recovery of the exact approved snapshot. If the snapshot or published-attempt identity cannot be established, record Published from the explicit confirmation with an open archive gap; keep the candidate and do not claim promotion completed.

## User confirmation is not a platform timestamp

Suppose these fictional facts are supplied:

- The user reported a submission at `2026-10-22T18:00:00+08:00`, but did not say when it was actually submitted.
- At `2026-10-23T09:00:00+08:00`, the user says "it is live now" for the identified attempt.
- The agent records that confirmation at `2026-10-23T09:05:00+08:00`.
- No platform publication timestamp/date is available.

The summary can be `Status: Published`, with empty `Submission date` and `Publication date`, and `Publication confirmed date: 2026-10-23`. A submission event records Unknown occurrence and the known observation time. The confirmation event is:

```text
### Event 4
Event: go-live-confirmed
Attempt: 2
Occurred at: 2026-10-23T09:00:00+08:00
Occurred timezone: +08:00
Observed at: 2026-10-23T09:00:00+08:00
Recorded at: 2026-10-23T09:05:00+08:00
Source: fictional user go-live report received at the stated observation time
Notes: confirmation received now; platform publication time/date not independently established
```

Occurred at here is the confirmation itself. It is not the earlier platform publication event. Add `promoted` only after the local replacement is verified; its local execution time must not fill Publication date.

If later supplied platform evidence reports only `2026-10-23` with timezone `Asia/Shanghai`, add a platform-published event with that date-only occurrence, the timezone, and the later observed/recorded times. Update Publication date to that evidenced date. Do not invent midnight or copy the later observation date into it. Preserve the earlier confirmation entry unchanged.

## Missing history and legacy records

- A new Draft can continue without Git or a snapshot. Report the pending archive/readiness dependency; do not invent a commit or initialize/fetch/push silently.
- A shallow/partial checkout may lack an older commit or asset content. Preserve its reference and report pending verification; do not substitute current HEAD. A shallow checkout with the required objects available is sufficient for that reference.
- A clean tracked diff does not cover untracked/ignored intended assets. Resolve those omissions before calling a new snapshot verified. Missing LFS/submodule content also needs explicit resolution; a pointer alone is not the upload asset.
- If an external submission/publication already happened, retain its reported event/status even if local traceability is incomplete. Backfill only from evidence of the actual submitted content.
- A legacy `Publication date: 2026-10-09` may mean the date a user confirmed go-live. Preserve that value and explain its known/unknown meaning in Review notes. Do not silently relabel it as a platform date or fabricate original observation times. Add a correction/evidence entry when clarification is obtained, retaining old/new values and the source.

These examples require deliberate Git and record handling. The [read-only checker](../checking.md) can inspect structural references and structured events, but it does not create snapshots, migrate records, authenticate external sources, or perform promotion.
