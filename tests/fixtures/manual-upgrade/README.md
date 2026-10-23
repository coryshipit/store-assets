# Manual-upgrade scenarios

Run from the repository root with Node.js 22+ and local Git:

```text
node tests/exercises/manual-upgrade.mjs
```

`facts.json` pins the previous kit's I.4 commit/template (`1.5.0`) and fictional Northstar Notes inputs. The runner reads that source from local Git without fetching; if it is unavailable, the exercise reports the limitation and fails without substituting today's source. The harness's knowledge of this baseline is not evidence available to the fictional unknown-origin installed kit.

The exercise constructs an adapted rulebook with `7.2.0-local`, a local first-submission extension, an adapted workflow, an unclassified local file, an active listing-only Draft, and a prior submission referencing a disposable Git commit. It adds an unknown provenance record, stages a manual upgrade, records a blocked local-rule conflict, and applies the supplied fictional decision. Only explicitly selected toolkit files and deliberate rule merges change; path/hash inventories protect every store's current/candidate/submission state and unrelated local files. The generated marker and local extension remain, history preserves unknown `from` identity, and the old submission still resolves to its original snapshot.

The runner also executes the actual Node stamping block extracted from `.github/workflows/release.yml` in a disposable `dist/store-assets/`. Synthetic `v9.9.9`/commit inputs are test identities, not real releases. It verifies release/source/template distinctions, archive-staging write scope, and rejection of invalid source identity, template mismatch, or installed-project history. A release archive must contain the stamped provenance plus the guide/example; actual GitHub execution and downloaded artifacts remain separate release evidence.

Execution copies are created under the system temporary directory, use fictional Git identity with hooks/signing disabled, never contact a remote, and are removed after verified scoped cleanup. No run logs or real application data are committed.

These are constructed-artifact and stamping implementation checks, not fresh-agent behavior. For an independent scenario, supply a fresh session only the adapted installed kit, separate incoming copy and these fictional facts. Ask it first to compare and record the unresolved conflict without touching store state; then supply the conflict decision in a separate task. Judge the resulting provenance, merged rules, preserved path/hash inventories and historical object retrieval. Do not infer success from its final message or treat the local extension as upstream-supported first-submission behavior.
