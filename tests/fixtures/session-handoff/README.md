# Session startup and handoff scenarios

`facts.md` and `scenarios.json` version the fictional state, tasks, allowed writes and invariants. Each independent scenario gets a fresh disposable project and context containing only its selected facts/kit files. The matrix references earlier fixtures for initialization, listing-only/package work, review fixes, promotion and upgrades; it does not assume their prior execution passed. Do not give the actor the expected answers, developer conversation, or a corrected previous output.

Run the constructed artifact exercise from the repository root:

```text
node tests/exercises/session-handoff.mjs
```

It copies the standalone kit and published baseline, creates an orphan candidate with a newer-filename inactive record, checks read-only findings, constructs the expressly confirmed recovery Draft, adds source-referenced interface-language notes, and checks a submitted-without-go-live state with pending historical evidence. The assertions validate fixture/record compatibility, preservation and canonical references using the copied checker. They do not prove an independent agent chooses the correct actions. No real artwork, upload or UI label is implied.

For independent behavior, run the selected matrix task through an available isolated executor, with no interactive question tools in a headless run. Missing-prerequisite scenarios must preserve dependent files and report the required fact/decision. Record observed file/action evidence and scope, not just the final message. No executor is prescribed or bundled, and this fixture never installs/launches an agent itself.

Results follow `docs/QA.md`: separate implementation/artifact/agent/release evidence; PASS/FAIL/INCONCLUSIVE only for executed cases; `not run` when no execution occurred; at most one INCONCLUSIVE retry from the original fixture in a new directory/context. Do not repair a failed actor's output and count it as success. Execution copies/logs stay outside Git and cleanup verifies the intended temporary scope.

## Independent input preparation and review

The repository-only helper prepares the selected actor input without launching an agent:

```text
node tests/exercises/independent-scenarios.mjs prepare orphan-ambiguous
```

Use any matrix ID. The command creates one OS-temporary run with `application/`, an `actor-task.txt` task, and observer-only `observer.json` containing the pre-action path/hash inventory. The adapted-upgrade case also has a separate read-only incoming kit. Give a fresh actor only its task and permitted project/incoming paths; do not give it observer metadata, invariants, development conversation or sibling executions. Native actors must start without inherited conversation. This helper is test preparation, not an application updater or an agent executor.

Inputs are constructed independently, not by repairing earlier outputs. The listing-only case selects the matrix's modern MSIX Desktop Logo variant: a supplied synthetic 300 x 300 PNG and SVG source with pending visual/external evidence. Review-fix/promotion inputs have real disposable Git asset commits preceding their referencing records. Upgrade input is read from the pinned prior source in `../manual-upgrade/facts.json`; missing local baseline history fails rather than fetching/substituting today's source. The harness's baseline knowledge is never evidence for the actor's unknown original provenance.

After the actor stops, inspect its files and report, then run:

```text
node tests/exercises/independent-scenarios.mjs review <run-path>
node tests/exercises/independent-scenarios.mjs cleanup <run-path>
```

Review prints changed paths, relevant saved record sections and copied-checker findings; it does not automatically award a behavior PASS. It refuses to execute an actor-modified checker without inspection. Independently assess allowed writes, application-state preservation, canonical references/claims, immutable objects, and event/source semantics against the selected invariants. Cleanup accepts only a verified helper-created temporary root. Retain needed conclusions before deletion; keep per-run files/logs out of Git. Preparation/review use local Git only and never initialize, commit, fetch or push this Store Assets repository. These controlled-file checks do not prove global executor cache/log isolation or real store behavior.
