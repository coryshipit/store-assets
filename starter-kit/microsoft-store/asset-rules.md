# Microsoft Store asset roles

Requirements reviewed: **2026-10-23**. This adapter covers updates to existing listings. Confirm the product kind, package route, supported devices, and current Partner Center fields before selecting a role. These facts cannot be inferred from an image's dimensions or the application's implementation framework.

## Verified listing roles

| Inventory role | Applies to | Partner Center destination | Requirement established by the source |
| --- | --- | --- | --- |
| `msix-app-tile` | MSIX, application, Desktop | `Store listings > Store logos > 1:1 App tile icon` | 300 × 300 PNG, no greater than 50 MB; recommended. If supplied, the Store prioritizes it over the package image. [MSIX images](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/screenshots-and-images#store-logos) |
| `msi-exe-box` | MSI/EXE, application, Desktop | `Store listings > Store logos > 1:1 box art` | Required; the MSI/EXE page establishes the square role but does not specify pixel dimensions, encoding, file-size limit, or alpha policy. Confirm those details in the current product's upload field. [MSI/EXE images](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/screenshots-and-images#store-logos) |
| `msi-exe-poster` | MSI/EXE, application, Desktop | `Store listings > Store logos > 2:3 poster art` | Recommended; the MSI/EXE page establishes the portrait role but leaves the same technical details unspecified. [MSI/EXE images](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/screenshots-and-images#store-logos) |

MSI/EXE listing fields are language-specific: see [Create an app submission, Store listings page](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msi/create-app-submission#store-listings-page). MSIX documentation also requires uploading images separately for each listing language, even when the images are identical. `shared/` below is a repository ownership convention; each export still names its language destinations.

For the MSIX 50 MB check, the checker uses a conservative 50,000,000-byte ceiling. Confirm borderline files in Partner Center. Microsoft does not specify a universal transparency rule in the role sections above. Record the actual alpha/background treatment and inspect its appearance; do not infer that transparency fixes a live rendering problem.

The MSIX page separately describes game box/poster art and Xbox requirements. Those constraints must not be transferred to MSI/EXE applications. Games, Xbox-specific artwork, PWA-specific rules, trailers, and other roles require additional sourced review; this version reports them as unsupported for automatic role validation. The existing screenshot `source/` / `export/` layout and naming rules continue unchanged; this Logo inventory does not validate screenshots.

## Listing Logos and package icons

A listing Logo uploaded to a language's Store listing and an icon embedded in a package are separate consumers, even when derived from the same master. Windows package/manifest icon sizes are not a listing export matrix. See Microsoft's [App icons](https://learn.microsoft.com/en-us/windows/apps/design/iconography/app-icons) and [icon construction](https://learn.microsoft.com/en-us/windows/apps/design/iconography/app-icon-construction) guidance for the application team's work.

Keep package icons/build outputs in the application project and reference their evidence in the submission's package fields or Review notes. Changing a listing export does not prove a package icon changed. Do not generate unused 44/50/150/256/etc. derivatives simply because a source supports those sizes. Each listing export below must have a named upload consumer.

## Inventory and ownership

For new or revised Logo work, copy [the inventory template](templates/asset-inventory.json.template) into each affected `<state>/<scope>/asset-inventory.json`, where `<state>` is `current` or `release-prep`, and `<scope>` is a locale such as `en-US` or the literal `shared`:

```text
<state>/<scope>/
├── asset-inventory.json
└── logos/
    ├── source/                   # preserved editable/input files
    └── export/                   # files with named upload consumers
```

Use localized ownership for language-specific artwork. Use `shared/` for one source/export deliberately reused across languages. A shared asset's `locales` lists every intended listing language; there is no inferred store-wide upload field. A localized inventory can reference a source in the same state's `shared/logos/source/`, but its exports belong to its own scope. Avoid duplicate assignments of the same role to the same language across inventories.

Paths in JSON are literal forward-slash paths relative to the copied **kit root**, e.g. `microsoft-store/release-prep/shared/logos/export/app-tile.png`. They must stay in the same state; sources belong under the owning scope's or `shared/logos/source/`, and exports under the owning scope's `logos/export/`. Copy an external source into that source directory with its origin/permission evidence; do not make the standalone candidate depend on an untracked external path.

Each inventory has `schema_version: 1`, `template_version`, `package_type` (`msix`, `msi-exe`, or `Unknown`), `product_type` (`app`, `game`, or `Unknown`), `device_family` (`Desktop` or another explicitly reviewed value), and an `assets` array. Each asset records:

- Unique `id`; `role`; exact English `destination` from the table (a stable local mapping, independent of interface language); nonempty `locales`.
- `source` (path or `null`), `source_provenance` (origin, permission/approval evidence, or an explicit unknown), and `export` (path or `null`).
- Declared `width`/`height` (positive integers or `null`), `format` (lowercase extension or `Unknown`), `transparency` (`present`, `absent`, or `Unknown`), and `generation_method` (actual tool/settings/recipe or explicit pending information).
- `requirements_source` (authoritative URL or explicit pending information), `requirements_reviewed` (date or `Unknown`), and `review: {visual, evidence}`. Visual state is `pending`, `approved`, or `changes-required`; evidence names the reviewer/date and what was examined, or an explicit pending gap.

`null` / `Unknown` / `Pending — reason` preserve incomplete Draft work; they do not establish readiness. Do not set `approved` from a technical check. Interface translations may be recorded in the submission's Review notes with observation source/date; the canonical destination and customer locales remain separate. Approval is for the exact source/export revision. When content changes, reset visual review to pending and obtain fresh evidence.

## Candidate, snapshot, and promotion

Copy each affected locale from `current/` as a complete candidate, preserving screenshots, listing text, and release notes. If shared assets change or are referenced by a candidate inventory, carry the **complete** `shared/` tree into `release-prep/` too, including unchanged assets used by other languages. Rewrite inventory paths only in the copied candidate to its new state. Never rewrite historical commits or edit the live inventory while preparing.

Record the complete affected locale trees **and the complete shared tree when used** under Submitted files and attempt Snapshot paths. The record's `Locales` includes all consumers of changed shared exports; changing an export used by two languages affects both. A language does not stop being a consumer simply because its text is unchanged. An inventory with `assets: []` is an explicit empty future inventory, useful when removing the last Logo export. Describe the removal, the platform-side action, and any verified fallback; deleting a file alone does not remove a remote upload.

Freeze sources, exports, inventories, and complete candidate trees together. On confirmed publication, promote the complete affected locale/shared snapshots and rewrite their working inventory paths to `current/`. This deterministic path rebasing is the only inventory change during promotion; retain the original attempt commit/path references. Remove only that completed preparation. Ensure shared assets needed by unaffected locales are retained. A missing or ambiguous prior shared baseline is an open item; do not invent it or silently delete its consumers.

Old projects without inventories remain readable. The checker reports unmapped Logo files for review, rather than inventing their role or migrating them. Add an inventory for new/revised Logo candidates after inspecting real sources and upload fields. Unchanged legacy assets with unresolved origin remain explicit review gaps.

## What checks establish

The optional checker verifies inventory structure, paths/ownership, source/export existence, duplicate role/language assignments, declared values, and PNG header dimensions. For the verified MSIX app-tile role it also checks 300 × 300, PNG, and the documented size ceiling. For MSI/EXE it checks the named role's aspect ratio, while leaving numeric dimensions/format acceptance to sourced review. A PNG header check does not decode the full image, verify its pixel alpha, or establish visual quality.

It reports pending/unsupported requirements and visual review separately. It does not inspect an authenticated upload screen or prove source rights, approval, upload, certification, or live rendering. Record actual upload and live-page observations with source/time in the submission's existing events/Review notes. See [the fictional example](../examples/logo-assets.md).
