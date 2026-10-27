# Logo inventory scenarios

Versioned inputs and assertions are constructed in `tests/check-store-assets.test.mjs`, using the fictional Northstar Notes published baseline. The test helper supplies actual synthetic PNG bytes, a fictional source, explicit role/package/consumer facts, and a pending visual review. No test data is a claim about real artwork, permissions, Partner Center acceptance, or live rendering.

Run from the repository root:

```text
node --test --test-reporter=spec tests/check-store-assets.test.mjs
```

Required cases cover localized/shared mapping; MSIX tile constraints versus MSI/EXE aspect ratios and unresolved pixel requirements; wrong package/field; unsupported games/roles; missing/misdeclared files; unlisted and duplicate exports; unknown provenance; legacy review; shared consumers/record scope; full historical source/export references; deliberate removal; and path-only inventory rebasing on promotion. Hash inventories verify read-only behavior including local Git metadata. The existing copied-CLI scenario verifies the checker has no repository-only imports.

The promotion scenario freezes complete locale/shared candidates, reports a fictional actual submission, supplies explicit fictional go-live confirmation, promotes images unchanged while rebasing only inventory paths, removes the candidate, and verifies the first attempt still reads its original committed inventory. A separate negative case deliberately omits source/scope from the stored attempt and must fail even when a working source exists.

All execution copies use the system temporary directory, with scoped cleanup. These are deterministic implementation and constructed-artifact results. One independent localized MSIX listing-only Logo preparation passed in the 2026-10-23 matrix (`tests/fixtures/session-handoff/README.md`). The shared two-locale inventory/promotion scenario described below and authenticated upload/live-page review remain **not run**.

For the remaining shared-asset coverage, give a fresh session only the copied kit, fictional published `1.0.0` Desktop/MSIX facts, complete `en-US`/`zh-CN` baselines, a supplied editable source with explicit fictional permission, and a task to prepare a shared Logo-only update. Require it to create one Draft, preserve live bytes and versions/release notes, inventory the single 300 x 300 export for both language fields, and retain pending visual/upload facts. For a separate promotion phase supply the identified frozen attempt and explicit go-live confirmation. Judge the produced inventory, complete scopes, unchanged image bytes and retained history; do not treat its final message as a PASS.
