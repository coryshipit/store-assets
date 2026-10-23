# Session startup and handoff scenarios

`facts.md` and `scenarios.json` version the fictional state, tasks, allowed writes and invariants. Each independent scenario gets a fresh disposable project and context containing only its selected facts/kit files. The matrix references earlier fixtures for initialization, listing-only/package work, review fixes, promotion and upgrades; it does not assume their prior execution passed. Do not give the actor the expected answers, developer conversation, or a corrected previous output.

Run the constructed artifact exercise from the repository root:

```text
node tests/exercises/session-handoff.mjs
```

It copies the standalone kit and published baseline, creates an orphan candidate with a newer-filename inactive record, checks read-only findings, constructs the expressly confirmed recovery Draft, adds source-referenced interface-language notes, and checks a submitted-without-go-live state with pending historical evidence. The assertions validate fixture/record compatibility, preservation and canonical references using the copied checker. They do not prove an independent agent chooses the correct actions. No real artwork, upload or UI label is implied.

For independent behavior, run the selected matrix task through an available isolated executor, with no interactive question tools in a headless run. Missing-prerequisite scenarios must preserve dependent files and report the required fact/decision. Record observed file/action evidence and scope, not just the final message. No executor is prescribed or bundled, and this fixture never installs/launches an agent itself.

Results follow `docs/QA.md`: separate implementation/artifact/agent/release evidence; PASS/FAIL/INCONCLUSIVE only for executed cases; `not run` when no execution occurred; at most one INCONCLUSIVE retry from the original fixture in a new directory/context. Do not repair a failed actor's output and count it as success. Execution copies/logs stay outside Git and cleanup verifies the intended temporary scope.
