# Fictional adapted-kit upgrade

Northstar Notes has an existing Microsoft Store listing at `1.0.0`, a Logo-only Draft with an active candidate, and a locally added `## Local first-submission extension` in its rulebook. The extension is user-owned and outside upstream's supported update workflow. An upgrade must preserve it without executing it or describing it as upstream support.

The installed rulebook says `template_version: 7.2.0-local`. No retained download/source establishes its original upstream release or template version. Begin [provenance](../upgrading.md) with unknown upstream identity and record the observed marker as local evidence:

```json
{
  "schema_version": 1,
  "upstream": {
    "repository": "Unknown",
    "release": "Unknown",
    "commit": "Unknown",
    "template_versions": {
      "templates/store-rulebook.md.template": "Unknown"
    },
    "evidence": "No retained original archive or verified source; installed generated marker 7.2.0-local is local evidence only"
  },
  "local_adaptations": [
    {
      "id": "first-submission-extension",
      "paths": ["northstar-notes-store-assets.md"],
      "description": "Preserve the local first-submission section and its local version marker",
      "reason": "Project-specific workflow outside upstream scope",
      "evidence": "Fictional supplied local rulebook; real review date/source must be recorded in the project"
    }
  ],
  "upgrade_history": []
}
```

Suppose the review copy contains the current kit source files, with its own evidence establishing only the supplied source directory and observed template markers. The incoming default `release: Unknown` / `commit: Unknown` must remain unknown. A real tagged release would instead provide its build-stamped identity for verification. Neither the target's marker nor the installed `7.2.0-local` proves the old origin.

Create one upgrade entry with `from` equal to the complete old upstream object and `to` equal to the reviewed incoming upstream object. Record the source-copy evidence, actual date/time, and selected per-path actions. Initially use `in-progress`.

| Path/scope | Reviewed action | Evidence required |
| --- | --- | --- |
| Incoming toolkit docs/templates/checker | Compare/add or deliberately merge | Incoming identity; installed differences; no collisions overwritten |
| `northstar-notes-store-assets.md` | Merge upgrade guidance and applicable upstream rules | Local section and marker retained; upstream generation changes recorded in provenance |
| `provenance.json` | Preserve adaptations; add from/to/outcome | Unknown old origin retained, not replaced by incoming defaults |
| All stores' `current/`, `release-prep/`, `submissions/` | Preserve paths and bytes | Before/after hash inventories, including Draft and prior immutable references |

If the local extension conflicts with upstream's first-submission boundary, record the conflicting path and text, leave the dependent change `blocked`, and retain the previous top-level upstream identity. The next session can see both the target and the unresolved decision. A supplied decision can retain the local extension as a clearly labeled adaptation while merging upstream's supported updates-only behavior; record that decision before completion. Do not silently delete either boundary or claim the local extension was tested by upstream.

After all reviewed changes and checks finish, append their actual results to `verification`, resolve each conflict with the decision/source, set this entry to `completed`, and advance top-level `upstream` to its `to` object. The history's `from` still contains `Unknown`; the local marker can still produce a version-drift review item. Preserve that truthful marker and explain its reviewed meaning instead of editing it merely to obtain a clean checker report.

The Draft remains a Draft with the same identity, versions, candidate files and open items. A missing Logo inventory or legacy attempt/date gap is pending **application work** under the relevant workflow, not a reason for the toolkit upgrade to rewrite its history or assets. No store upload or publication is established by the upgrade.
