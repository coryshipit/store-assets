# Fictional Logo-only update

Northstar Notes is a fictional **MSIX Desktop application** with an existing published `1.0.0` listing in `en-US` and `zh-CN`. This example defines planned files, not shipped artwork or actual approval/upload evidence. Use [the Microsoft role rules](../microsoft-store/asset-rules.md) before adapting it to another package route.

The application team supplies an approved editable mark. Preserve it as `microsoft-store/release-prep/shared/logos/source/northstar-mark.svg` with its origin/permission evidence. Produce one `app-tile.png`, a 300 × 300 PNG. Its consumers are the two languages' `Store logos > 1:1 App tile icon` fields. It is not a Windows package icon and no additional size variants are needed for this example.

After copying both complete locale baselines and the complete shared baseline into the candidate, `microsoft-store/release-prep/shared/asset-inventory.json` contains:

```json
{
  "schema_version": 1,
  "template_version": "1.0.0",
  "package_type": "msix",
  "product_type": "app",
  "device_family": "Desktop",
  "assets": [
    {
      "id": "app-tile",
      "role": "msix-app-tile",
      "destination": "Store listings > Store logos > 1:1 App tile icon",
      "locales": ["en-US", "zh-CN"],
      "source": "microsoft-store/release-prep/shared/logos/source/northstar-mark.svg",
      "source_provenance": "Fictional application-team vector; real origin/permission evidence must replace this example",
      "export": "microsoft-store/release-prep/shared/logos/export/app-tile.png",
      "width": 300,
      "height": 300,
      "format": "png",
      "transparency": "absent",
      "generation_method": "Planned: render the supplied vector at 300 x 300 with the confirmed opaque background; record actual tool/settings after export",
      "requirements_source": "https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/screenshots-and-images#store-logos",
      "requirements_reviewed": "2026-10-23",
      "review": {
        "visual": "pending",
        "evidence": "Pending — review actual exported mark, spacing, background and legibility"
      }
    }
  ]
}
```

There is one source-to-export relationship and two upload consumers. Do not create another inventory assigning `msix-app-tile` to either language unless replacing this assignment deliberately. If artwork contains localized text, move each export into its language scope and give it its own inventory; sharing the source remains possible.

The Draft retains `Released application version: 1.0.0`, `Application version: 1.0.0`, `Update type: listing-only`, and `Not applicable` in both new-package fields. Its Locales is `en-US, zh-CN`. Submitted files uses complete kit-relative scopes:

```text
- microsoft-store/release-prep/en-US
- microsoft-store/release-prep/zh-CN
- microsoft-store/release-prep/shared
```

The attempt's Snapshot paths adds the application's repository prefix, for example `store-assets/` before each path. Freeze only after actual source/export review and approval. Preserve release notes and screenshots; pending export/review blocks readiness. The inventory does not prove either upload occurred.

After explicit go-live confirmation for that attempt, promote both locale trees and the complete shared tree. In the promoted inventory, replace the path prefix `microsoft-store/release-prep/` with `microsoft-store/current/`; the original committed inventory and attempt references stay unchanged. A later task can still retrieve the original source/export from that commit. Record whether anyone actually observed both language listings; confirmation alone does not establish that a previously reported Logo problem was visually resolved.

## Different routes and incomplete facts

- For an **MSI/EXE** application, use `msi-exe-box` for the required box-art field or `msi-exe-poster` for the recommended poster field. Copy the precise destination from the rules table. Record actual dimensions/encoding from the file and current upload requirements, with source/date. The MSIX 300 × 300 requirement and game box-art dimensions do not establish MSI/EXE upload acceptance.
- For a **package icon** change, work with the application team on its manifest/build assets and reference that evidence in a package update. A listing-only PNG does not establish this change.
- For an **unknown source**, preserve the supplied file and record the gap. A filename or successful PNG-header check does not establish permission or approval.
- For a **planned removal**, remove that row/export from the complete candidate, preserving other consumers; retain `assets: []` if the inventory is now empty. Record the intended remote field removal and verified fallback separately. The previous attempt retains the removed file in its original snapshot.
