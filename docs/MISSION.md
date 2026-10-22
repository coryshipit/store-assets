# Store Assets Mission

Store Assets is a Git-native, agent-readable workflow for preparing and managing app store submissions.

It helps developers and AI agents organize store copy, screenshots, release notes, submission records, and release-readiness state inside a Git repository, then hand off to the store's official CLI, API, or CI tooling for the actual submission.

The current phase focuses on updates to existing Microsoft Store listings and delivers a documented workflow, reusable templates, and a copyable starter kit. An application's first store submission is outside the workflow's scope. Apple App Store and Google Play are future directions and are not assumed until researched and verified.

Store Assets is not a store backend replacement, not a SaaS, GUI, ASO platform, or auto-upload service. It standardizes preparation, not upload.

## Where the rules live

The user-facing package plays the role that the reference project layout drafts played. Within a copied `starter-kit/` (shipped and installed as `store-assets/`), process and rules are split between the workflow and the generated rulebook:

| Reference rule (project description) | Home in the starter kit |
|---|---|
| Variable interface: project / submission / substitution rules | `store-assets-workflow.md` §2 |
| Process: init / prepare / submit / promote lifecycle | `store-assets-workflow.md` §4 |
| Agent execution flow | `store-assets-workflow.md` "Agent execution summary" |
| Standard structure | `templates/store-rulebook.md.template` §3 → generated `<PRODUCT_NAME>-store-assets.md` |
| Directory responsibilities | `templates/store-rulebook.md.template` §4 |
| Naming rules | `templates/store-rulebook.md.template` §5 |
| Required file contents | `templates/store-rulebook.md.template` §6 |
| Content accuracy rules | `templates/store-rulebook.md.template` §7 |
| Security rules | `templates/store-rulebook.md.template` §8 |
| Ready-for-submission checklist | `templates/store-rulebook.md.template` §9 |
| Package entry document | static `README.md` (shipped in `starter-kit/`, no placeholders) |
| Optional structural checks | `checking.md` + `scripts/check-store-assets.mjs` (read-only; does not authenticate evidence or publish) |

Intentional differences from the reference layout:

- Submission variables are recorded in `submissions/<submission-id>.md`, not inside a `release-prep/<submission-id>/` subfolder. `release-prep/` is organized per locale and mirrors `current/<locale>/`.
- The status machine includes `Action required` so a store verdict that returns for fixes is represented without forcing `Rejected`.
- `apple-app-store/` and `google-play/` exist as empty reserved skeleton directories with the same `current` / `release-prep` / `submissions` / `templates` shape; no store-specific rules for them are assumed in this phase.
- Rules that are generic are a stable spec (`store-assets-workflow.md`); rules that depend on the product are generated with resolved variables (the rulebook). Neither document hard-codes project values. The package `README.md` is a static guide and contains no placeholders.
