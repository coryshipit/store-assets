# Store Assets Distribution

This document describes how the Store Assets `starter-kit` is packaged and distributed to users.

It is a technical document for the repository itself. It is not user-facing usage instructions for the starter kit; those live in [`../starter-kit/store-assets-workflow.md`](../starter-kit/store-assets-workflow.md).

## Distribution model

Users obtain the package by downloading it, then copying it into their own application project:

```text
Download release asset
        ↓
store-assets/          # top-level folder inside the zip
        ↓
copy into the user's app project
        ↓
read store-assets/store-assets-workflow.md
        ↓
use
```

The canonical user-facing package is `starter-kit/` in the repository. It is packaged for release with the top-level folder named `store-assets/` — the exact name the user will install and use — so a fresh download needs no renaming step. Distribution happens through GitHub Releases: the package is built into a versioned release asset.

## What gets packaged

The package must contain a fully self-contained working copy. Inside the zip, the top-level folder is `store-assets/` (the repository's `starter-kit/` renamed at package time):

```text
store-assets/
├── README.md                       # static package overview
├── store-assets-workflow.md       # process spec
├── templates/                     # document template sources
│   └── store-rulebook.md.template
├── microsoft-store/
│   ├── current/
│   ├── release-prep/
│   ├── submissions/
│   └── templates/
├── apple-app-store/               # reserved skeleton
├── google-play/                   # reserved skeleton
└── ...
```

Rules for what is included and what is not:

- Include everything under `starter-kit/` as-is.
- Rename the top-level folder from `starter-kit/` to `store-assets/` when building the zip.
- Do not include the root repo's development documents (e.g. `reference/`, `docs/`, root `README.md`, root `AGENTS.md`).
- The packaged kit must be readable and usable on its own, without any context from the repository.

## Versioning and release artifacts

- Each release corresponds to a version tag in the repository (for example `vX.Y.Z`).
- The release asset name follows a stable convention, for example:

  ```text
  store-assets-starter-kit-v1.0.0.zip
  ```

- Existing releases are not mutated once published. A new version of the kit is a new release.
- Release-note source files are versioned at `docs/releases/<tag>.md`. Before publishing a draft release, use the matching source file to replace the workflow's placeholder notes.

## Required workflow behavior

Current status: implemented (2026-08-09) via `.github/workflows/release.yml` — a tag-triggered (`vX.Y.Z`) GitHub Actions workflow.

For each release tag, the mechanism should:

1. Package the `starter-kit/` directory into a zip archive, renaming the top-level folder to `store-assets/`.
2. Keep the internal directory structure and file paths identical to the installed layout (top-level folder `store-assets/`, then the kit structure as-is).
3. Exclude anything outside `starter-kit/`.
4. Attach the zip to the release as an asset.
5. Be repeatable while its GitHub Release remains a draft; published releases and their assets are never modified.

The workflow only runs when a `vX.Y.Z` tag is pushed. It packages `starter-kit/` as `store-assets/` in a zip named `store-assets-starter-kit-<tag>.zip`, verifies that every archive path is under `store-assets/`, checks the static README, workflow, and rulebook template, rejects development files, and attaches the zip to a draft release. It creates the draft if needed. Re-runs may replace an asset only while that release is still a draft; a published release causes the workflow to fail rather than mutate it.

## Acceptance criteria

| Criterion | Status |
| --- | --- |
| A release produces a downloadable, versioned plain zip whose top-level folder is `store-assets/` | done |
| The zip is self-contained and documents the project on its own | done |
| Packaging is repeatable and does not require manual steps | done |
| Users can copy the zip content into their project and follow `store-assets/store-assets-workflow.md` | done |
