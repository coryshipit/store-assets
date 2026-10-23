# Store Assets

Store Assets is a Git-native, agent-readable workflow for preparing application store submissions. It organizes store copy, screenshots, release notes, submission records, and release-readiness state inside the repository, then hands off to the store's official CLI, API, or CI tooling for the actual submission.

It is not a store backend, GUI, ASO platform, or auto-upload service. It standardizes preparation, not upload.

## How to start

1. Copy this folder into your application repository as `store-assets/` (it ships named `store-assets/`, so a direct copy needs no renaming). Each application project uses one independent `store-assets/` work package.
2. Ask an agent to read `store-assets-workflow.md` before initializing or doing store work.
3. Store Assets currently manages updates to an existing Microsoft Store listing. For a new application that has not yet been published, keep the work package in the project but complete the first store submission outside this workflow.
4. After a Microsoft Store version is live, the agent reads the rule template, confirms project facts (product name, default locale, current app version), and generates the rulebook `<PRODUCT_NAME>-store-assets.md`. Every later task then starts from the rulebook.

For an initialized project, ask to prepare either a **listing-only update** (copy, screenshots, or Logos without a new package) or a **package update** (also used when a new package and listing changes ship together). A listing-only update keeps the confirmed published application version; no new package version is needed. Both tasks produce a complete candidate and an independent Draft record. Missing package evidence for a package update is recorded as pending and blocks readiness, rather than being invented.

If candidate files already exist without their own record, ask the agent to inspect and recover their association before starting another update. See [update examples](examples/update-tasks.md) for field values and recovery cases.

Before actual submission, bind the approved complete candidate to a verified Git commit and its repository-relative paths. Keep each attempt's reference after promotion or review fixes. Record store event times separately from when you learned or wrote them down: "it is live now" confirms publication, but does not establish the platform's publication timestamp. See [submission history examples](examples/submission-history.md).

For a read-only structural check, run `node store-assets/scripts/check-store-assets.mjs --root store-assets` from your application root (Node.js 22+). It reports errors and review items without modifying files. See [checking.md](checking.md) for Git requirements, record syntax, and exit codes; zero errors does not mean ready for submission.

For Logo changes, use the Microsoft-specific [asset roles and inventory guide](microsoft-store/asset-rules.md) and [Logo example](examples/logo-assets.md). Each export names its source, listing language consumers, and upload field. MSIX listing Logos and MSI/EXE box/poster art have distinct rules; package icons are separate application assets. Inventories support localized ownership or deliberate sharing without changing screenshot directories.

To update an installed kit, follow [the manual upgrade guide](upgrading.md). Keep its [provenance record](provenance.json), compare incoming files in a separate folder, and merge local rules deliberately. The record keeps upstream release/commit/template evidence, local adaptations and upgrade history; an unknown original source stays unknown. Toolkit upgrades preserve current assets, active candidates and submission history. See [the customized-kit example](examples/manual-upgrade.md).

In a new conversation, ask the agent to read the workflow and existing rulebook, inspect saved records/candidates, and identify the task before continuing. Its handoff points to the existing record, evidence, gaps and next action. A missing Draft or ambiguous ownership needs recovery; "continue" supplies no missing publication evidence. See [session examples](examples/session-handoff.md). Customer listing languages remain independent of the store interface language.

## How the kit is organized

```text
store-assets/
├── README.md                       # this file — static package overview
├── checking.md                     # optional checker usage and result meanings
├── upgrading.md                    # manual comparison, ownership and conflict handling
├── provenance.json                 # upstream source, adaptations and upgrade history
├── store-assets-workflow.md       # process spec — how every task runs
├── <PRODUCT_NAME>-store-assets.md  # generated rulebook — this project's rules
├── templates/
│   └── store-rulebook.md.template # rule source; generates the rulebook
├── examples/
│   ├── update-tasks.md            # fictional task examples, not application data
│   ├── submission-history.md      # durable snapshots and event/date meanings
│   ├── logo-assets.md             # source/export and upload-consumer example
│   ├── manual-upgrade.md          # customized/unknown-origin upgrade example
│   └── session-handoff.md         # saved-state continuation and field references
├── scripts/
│   └── check-store-assets.mjs      # read-only structural checks, Node.js standard library
├── microsoft-store/
│   ├── asset-rules.md             # verified Logo roles and inventory contract
│   ├── current/                  # live, published assets (per locale)
│   ├── release-prep/             # draft assets (per locale)
│   ├── submissions/              # one record file per submission
│   └── templates/                # asset-inventory.json.template
├── apple-app-store/              # reserved skeleton (future adapter)
└── google-play/                  # reserved skeleton (future adapter)
```

The kit ships this static `README.md`, the workflow, checking guide/script, templates, fictional examples, and store folders. It ships no repository development files (`AGENTS.md`, `docs/`, or `tests/`). The rulebook is created by the first run; until then the workflow and template supply the executable process and rules. Examples illustrate those rules and are never copied into a live submission as facts.

## Workflow vs rulebook

Two documents do different jobs, and their split is deliberate:

- `store-assets-workflow.md` is the **process spec**. It ships as the shared upstream process and is the point of entry for every task. It defines the supported store adapters and the variable contract — which placeholders mean, where their values come from, and how templates should be shipped. Record project-specific workflow edits as local adaptations in provenance so an upgrade can preserve and review them.
- `<PRODUCT_NAME>-store-assets.md` is the **project rulebook**. It is generated once from `templates/store-rulebook.md.template` with your project's values, and holds this project's structure, naming, and validation rules. Later changes are merged into it deliberately, preserving local rules and generation evidence.

In one line: workflow is the protocol, rulebook is this project's resolved rules.

## Lifecycle

```text
current → release-prep → submission → published → current
```
