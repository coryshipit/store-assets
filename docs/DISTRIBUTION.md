# Store Assets Distribution

This document describes how the Store Assets `starter-kit` is packaged and distributed to users.

It is a technical document for the repository itself. It is not user-facing usage instructions for the starter kit; those live in [`../starter-kit/store-assets-workflow.md`](../starter-kit/store-assets-workflow.md).

## Distribution model

Users obtain the package by downloading it, then copying it into their own application project:

```text
Download release asset
        ↓
starter-kit/
        ↓
copy into the user's app project
        ↓
read starter-kit/store-assets-workflow.md
        ↓
use
```

The canonical user-facing package is `starter-kit/`. Distribution happens through GitHub Releases: the `starter-kit/` directory is packaged into a versioned release asset.

## What gets packaged

The package must contain a fully self-contained working copy:

```text
starter-kit/
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
- Do not include the root repo's development documents (e.g. `reference/`, `docs/`, root `README.md`, root `AGENTS.md`).
- The packaged kit must be readable and usable on its own, without any context from the repository.

## Versioning and release artifacts

- Each release corresponds to a version tag in the repository (for example `vX.Y.Z`).
- The release asset name follows a stable convention, for example:

  ```text
  store-assets-starter-kit-v1.0.0.zip
  ```

- Existing releases are not mutated once published. A new version of the kit is a new release.

## Required workflow behavior (todo: implement in Task B)

Current status: not yet implemented (blocked until the distribution mechanism task is opened; see [`ROADMAP.md`](ROADMAP.md)).

For each release tag, the mechanism should:

1. Package the `starter-kit/` directory into a zip archive.
2. Keep directory structure and file paths inside the zip identical to the repository layout.
3. Exclude anything outside `starter-kit/`.
4. Attach the zip to the release as an asset.
5. Be repeatable: the same tag always produces the same artifact.

Recommended implementation: a tag-triggered GitHub Actions workflow.

## Acceptance criteria

| Criterion | Status |
| --- | --- |
| A release produces a downloadable, versioned plain zip of `starter-kit/` | todo |
| The zip is self-contained and documents the project on its own | todo |
| Packaging is repeatable and does not require manual steps | todo |
| Users can copy the zip content into their project and follow `starter-kit/store-assets-workflow.md` | todo |