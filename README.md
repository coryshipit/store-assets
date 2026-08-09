# Store Assets 🚀

Store Assets is a Git-native, agent-readable workflow for preparing app store submissions.

It helps developers and AI agents keep store copy, screenshots, release notes, submission records, and release-readiness state in a Git repository — tracked, verifiable, and ready to hand off to the store's official CLI, API, or CI tooling. 🧩📦

It is **not** a store backend replacement, SaaS, GUI, ASO platform, or auto-upload service. It standardizes preparation, not upload.

## ⚡ Getting started

To use Store Assets in your own app project:

1. 📥 Download the latest release zip from GitHub Releases and unzip it — you get a `store-assets/` folder, ready to use.
2. 📂 Drop `store-assets/` into your app repository (it ships with the right name, so no renaming needed).
3. 🤖 Ask an agent to read `store-assets-workflow.md` first.
4. ✅ Run initialization, prepare a submission, or run a validation task.

`starter-kit/` is the copyable work package for users; the root `AGENTS.md` governs development of Store Assets itself and should not be copied into user projects.

## 🗂️ Documentation

| Document | Purpose |
|---|---|
| [`AGENTS.md`](AGENTS.md) | Behavior rules for agents developing this repo |
| [`docs/MISSION.md`](docs/MISSION.md) | The project mission |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Direction and task progress |
| [`docs/QA.md`](docs/QA.md) | Quality checks and dry-run verification for the starter kit |
| [`docs/DISTRIBUTION.md`](docs/DISTRIBUTION.md) | How the starter kit is packaged and released |
| [`starter-kit/`](starter-kit/) | The downloadable, copyable work package |

## 🔄 Core lifecycle

```text
current → release-prep → submission → published → current
```

Different stores may keep their own fields and validation rules, but the lifecycle stays the same.

## 🎯 Current scope

Microsoft Store is fully supported today. Apple App Store and Google Play are future directions; no specific rules are assumed for them until they are researched and verified.