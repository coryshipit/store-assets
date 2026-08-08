# Store Assets

This directory is the **copyable working package** of Store Assets.

Store Assets is a Git-native, agent-readable workflow for preparing app store submissions. It organizes store copy, screenshots, release notes, submission records, and release-readiness state inside the repository, then hands off to the store's official CLI, API, or CI tooling for the actual submission.

It is **not** a store backend replacement, SaaS, GUI, ASO platform, or auto-upload service. It standardizes preparation, not upload.

## What is inside

```text
store-assets/
├── README.md                     # this file — static package overview
├── store-assets-workflow.md      # process spec — how the workflow runs
├── templates/
│   └── store-rulebook.md.template # rule source; generates <product name>-store-assets.md
├── microsoft-store/
│   ├── current/                  # live, published assets (per locale)
│   ├── release-prep/             # draft assets (per locale)
│   ├── submissions/              # one record file per submission
│   └── templates/                # record template sources (reserved)
├── apple-app-store/              # reserved skeleton (future adapter)
└── google-play/                  # reserved skeleton (future adapter)
```

## How to use it

1. Copy this package into your application project as `store-assets/`.
2. Read `store-assets-workflow.md` — it is the process spec: lifecycle, status machine, steps, and the variable interface.
3. Ask an agent to initialize the store assets, or follow `store-assets-workflow.md` yourself.
4. Prepare drafts in `microsoft-store/release-prep/<locale>/`; record each submission in `microsoft-store/submissions/`.
5. Only promote to `microsoft-store/current/<locale>/` after the store has published the submission.

## How rules are created

Process lives in `store-assets-workflow.md`. Per-project rules (structure, naming, file contents, validation) live in the rulebook, which is generated once per project from `templates/store-rulebook.md.template`. The rulebook filename follows `<product name>-store-assets.md`; see the workflow for the exact naming.

## Notes

This `README.md` is a static guide — it describes the package itself, not any specific project. It contains no project-specific values and is not generated from a template.