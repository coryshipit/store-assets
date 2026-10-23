// Constructed manual-upgrade evidence, not an updater or independent agent run.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const source = path.join(repo, 'starter-kit');
const facts = JSON.parse(fs.readFileSync(path.join(repo, 'tests/fixtures/manual-upgrade/facts.json'), 'utf8'));
const run = fs.mkdtempSync(path.join(os.tmpdir(), 'store-assets-i5-'));
let passed = 0;
function check(condition, message) { assert.ok(condition, message); passed++; }
function inside(target) {
  const relative = path.relative(fs.realpathSync(run), path.resolve(target));
  assert.ok(relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative), 'Mutation must remain in the disposable run');
}
function write(file, data) { inside(file); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); }
function json(file, value) { write(file, JSON.stringify(value, null, 2) + '\n'); }
function read(file) { return fs.readFileSync(file, 'utf8'); }
function list(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), 'Fixtures use ordinary files');
    return entry.isDirectory() ? list(file) : [file];
  }).sort();
}
function signature(directory) {
  return list(directory).map(file => path.relative(directory, file).split(path.sep).join('/') + '|' +
    crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')).join('\n');
}
function git(directory, args) {
  if (directory === repo) assert.ok(['ls-tree', 'cat-file'].includes(args[0]), 'Source repository access is read-only');
  else inside(directory);
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_NO_LAZY_FETCH: '1', GIT_TERMINAL_PROMPT: '0' };
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR']) delete env[key];
  const result = spawnSync('git', ['--no-optional-locks', '--no-lazy-fetch', '-c', 'core.fsmonitor=false', '-c', 'protocol.allow=never',
    '-c', 'core.hooksPath=' + path.join(run, 'empty-hooks'), '-c', 'commit.gpgsign=false', '-C', directory, ...args],
  { env, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr?.toString() || result.error?.message || 'Local Git operation failed; required baseline/history may be unavailable');
  return result.stdout;
}
function stateSignature(kit) {
  return ['microsoft-store', 'apple-app-store', 'google-play'].flatMap(store => ['current', 'release-prep', 'submissions'].map(area =>
    store + '/' + area + '\n' + signature(path.join(kit, store, area)))).join('\n');
}
function resolveBook(template) {
  let text = template;
  const version = template.match(/^template_version:\s*(.+)$/m)[1].trim();
  for (const [key, value] of Object.entries({ PRODUCT_NAME: facts.product, STORE_PLATFORM: 'microsoft-store', STORE_DISPLAY_NAME: 'Microsoft Store',
    DEFAULT_LOCALE: facts.locale, CURRENT_APP_VERSION: facts.application_version, RULEBOOK_FILE: 'northstar-notes-store-assets.md', TEMPLATE_VERSION: version })) text = text.replaceAll('{{' + key + '}}', value);
  return text;
}
const sourceBefore = signature(source);
const sourceVersion = read(path.join(source, 'templates/store-rulebook.md.template')).match(/^template_version:\s*(.+)$/m)[1].trim();
try {
  // Exercise the actual build code; do not maintain a parallel stamping implementation.
  const workflow = read(path.join(repo, '.github/workflows/release.yml'));
  const match = workflow.match(/node --input-type=module <<'NODE'\r?\n([\s\S]*?)^          NODE\s*$/m);
  assert.ok(match, 'Release workflow must expose its inline Node stamping block');
  const stampCode = match[1].split(/\r?\n/).map(line => line.replace(/^          /, '')).join('\n');
  const staging = path.join(run, 'release-build'), staged = path.join(staging, 'dist/store-assets');
  fs.cpSync(source, staged, { recursive: true });
  const stagingBefore = new Map(list(staged).map(file => [path.relative(staged, file), fs.readFileSync(file)]));
  const env = { ...process.env, GITHUB_REF_NAME: 'v9.9.9', KIT_SOURCE_COMMIT: 'a'.repeat(40), GITHUB_REPOSITORY: 'fixture/store-assets' };
  const stamp = overrides => spawnSync(process.execPath, ['--input-type=module', '-e', stampCode], { cwd: staging, env: { ...env, ...overrides }, encoding: 'utf8', windowsHide: true });
  const result = stamp({}); check(result.status === 0, result.stderr);
  const provenancePath = path.join(staged, 'provenance.json'), releaseProvenance = JSON.parse(read(provenancePath));
  check(releaseProvenance.upstream.release === 'v9.9.9' && releaseProvenance.upstream.commit === 'a'.repeat(40), 'Stamp records independent toolkit release and full source commit');
  check(releaseProvenance.upstream.repository === 'https://github.com/fixture/store-assets', 'Stamp identifies actual source repository');
  check(releaseProvenance.upstream.template_versions['templates/store-rulebook.md.template'] === sourceVersion &&
    releaseProvenance.upstream.template_versions['microsoft-store/templates/asset-inventory.json.template'] === '1.0.0', 'Template versions remain separate');
  for (const [relative, bytes] of stagingBefore) if (relative !== 'provenance.json') check(fs.readFileSync(path.join(staged, relative)).equals(bytes), 'Stamp preserves other staged file: ' + relative);
  for (const overrides of [{ KIT_SOURCE_COMMIT: 'HEAD' }, { GITHUB_REF_NAME: 'v9.9' }, { GITHUB_REPOSITORY: '../outside' }]) {
    const before = read(provenancePath); check(stamp(overrides).status !== 0 && read(provenancePath) === before, 'Invalid source identity fails before mutation');
  }
  const invalid = structuredClone(releaseProvenance); invalid.upstream.template_versions['templates/store-rulebook.md.template'] = '999.0.0'; json(provenancePath, invalid);
  let before = read(provenancePath); check(stamp({}).status !== 0 && read(provenancePath) === before, 'Template marker mismatch fails before mutation');
  invalid.upstream = releaseProvenance.upstream; invalid.local_adaptations.push({ id: 'private-project-change' }); json(provenancePath, invalid);
  before = read(provenancePath); check(stamp({}).status !== 0 && read(provenancePath) === before, 'Installed adaptations cannot enter a release build');
  invalid.local_adaptations = []; invalid.upgrade_history.push({ id: 'private-upgrade' }); json(provenancePath, invalid);
  before = read(provenancePath); check(stamp({}).status !== 0 && read(provenancePath) === before, 'Installed upgrade history cannot enter a release build');

  const project = path.join(run, 'application'), kit = path.join(project, 'store-assets');
  const oldTree = git(repo, ['ls-tree', '-r', '-z', facts.baseline_commit, '--', 'starter-kit']).toString('utf8');
  check(oldTree.length > 0, 'Pinned previous source is locally available; no current-source substitution');
  for (const row of oldTree.split('\0').filter(Boolean)) {
    const entry = row.match(/^\d+ blob ([0-9a-f]+)\tstarter-kit\/(.+)$/); assert.ok(entry, 'Expected ordinary source blobs');
    write(path.join(kit, entry[2]), git(repo, ['cat-file', 'blob', entry[1]]));
  }
  check(!fs.existsSync(path.join(kit, 'provenance.json')), 'Previous kit has no provenance record');
  const oldTemplate = read(path.join(kit, 'templates/store-rulebook.md.template'));
  check(oldTemplate.includes('template_version: ' + facts.baseline_rulebook_template), 'Actual previous template is used');
  const bookPath = path.join(kit, 'northstar-notes-store-assets.md');
  let book = resolveBook(oldTemplate).replace(/^template_version:.*$/m, 'template_version: ' + facts.local_marker);
  write(bookPath, book + '\n' + facts.local_extension);
  write(path.join(kit, 'store-assets-workflow.md'), read(path.join(kit, 'store-assets-workflow.md')) + '\n' + facts.workflow_adaptation + '\n');
  write(path.join(kit, 'local-notes.md'), 'User-owned note with no incoming counterpart. Preserve its exact bytes.\n');
  write(path.join(project, 'application.md'), 'Fictional Northstar Notes application, outside the toolkit upgrade scope.\n');
  const live = path.join(kit, 'microsoft-store/current/en-US');
  fs.cpSync(path.join(repo, 'tests/fixtures/update-tasks/published'), live, { recursive: true });
  git(project, ['init', '--quiet', '--initial-branch=main']); git(project, ['config', 'user.name', 'Upgrade Fixture']); git(project, ['config', 'user.email', 'fixture@example.invalid']);
  git(project, ['config', 'core.autocrlf', 'false']); git(project, ['add', '--all']); git(project, ['commit', '--quiet', '-m', 'Fictional published baseline']);
  const baseline = git(project, ['rev-parse', 'HEAD']).toString('utf8').trim();
  const historicalListing = git(project, ['show', baseline + ':store-assets/microsoft-store/current/en-US/listing.md']);
  const history = `# Northstar Notes Microsoft Store Submission — ${facts.history_id}
Submission ID: ${facts.history_id}
Status: Published
Locales: en-US

## Submitted files
- microsoft-store/current/en-US

## Submission attempts
### Attempt 1
Snapshot commit: ${baseline}
Snapshot paths:
- store-assets/microsoft-store/current/en-US
Approval source: Explicit fictional baseline facts
Snapshot verification: Verified
Verified at: ${facts.recorded_at}

## Review notes
Legacy fixture; original platform date/source remain unknown.
`;
  write(path.join(kit, 'microsoft-store/submissions', facts.history_id + '.md'), history);
  const candidate = path.join(kit, 'microsoft-store/release-prep/en-US'); fs.cpSync(live, candidate, { recursive: true });
  write(path.join(candidate, 'logos/store-logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><desc>Fictional pending Logo, not upload-ready</desc></svg>\n');
  const fields = { 'Submission ID': facts.draft_id, 'Draft created date': '2026-10-23', 'Submission date': '', 'Released application version': '1.0.0', 'Application version': '1.0.0',
    'Update type': 'listing-only', 'New package version': 'Not applicable', 'Package evidence': 'Not applicable', 'Store submission ID': 'Pending — not submitted',
    Locales: 'en-US', Status: 'Draft', 'Publication date': '', 'Publication confirmed date': '' };
  write(path.join(kit, 'microsoft-store/submissions', facts.draft_id + '.md'), ['# Northstar Notes Microsoft Store Submission — ' + facts.draft_id,
    ...Object.entries(fields).map(([key, value]) => key + ': ' + value), '', '## Changes', 'Fictional Logo-only update.', '', '## Submitted files', '- microsoft-store/release-prep/en-US',
    '', '## Submission attempts', 'None — not frozen or submitted', '', '## Events', '### Event 1', 'Event: draft-created', 'Attempt: Not applicable', 'Occurred at: ' + facts.recorded_at,
    'Occurred timezone: +08:00', 'Observed at: ' + facts.recorded_at, 'Recorded at: ' + facts.recorded_at, 'Source: Supplied fictional fixture facts', 'Notes: Local preparation only.',
    '', '## Open items', 'Logo role/provenance/visual review remain unverified.', '', '## Certification result', 'Not submitted', '', '## Review notes', 'Preserve through toolkit upgrade.', ''].join('\n'));
  const stateBefore = stateSignature(kit), noteBefore = read(path.join(kit, 'local-notes.md')), appBefore = read(path.join(project, 'application.md'));
  const unknownUpstream = { repository: 'Unknown', release: 'Unknown', commit: 'Unknown', template_versions: { 'templates/store-rulebook.md.template': 'Unknown' }, evidence: facts.source_identity_note };
  const priorEntry = { id: 'earlier-inspection', recorded_at: 'Unknown', from: structuredClone(unknownUpstream), to: structuredClone(unknownUpstream), status: 'abandoned', changes: [], conflicts: [], verification: 'Fictional earlier inspection; no retained source identity or changes.' };
  const installed = { schema_version: 1, upstream: structuredClone(unknownUpstream), local_adaptations: [
    { id: 'first-submission-extension', paths: ['northstar-notes-store-assets.md'], description: 'Retain local extension and marker ' + facts.local_marker, reason: 'Local project workflow outside upstream support', evidence: 'Supplied fictional rulebook and facts' },
    { id: 'workflow-review', paths: ['store-assets-workflow.md'], description: facts.workflow_adaptation, reason: 'Fictional project review requirement', evidence: 'Supplied fictional installed workflow' },
    { id: 'local-notes', paths: ['local-notes.md'], description: 'Unclassified local note retained', reason: 'User content', evidence: 'Inspected before comparison' },
  ], upgrade_history: [structuredClone(priorEntry)] };
  const installedPath = path.join(kit, 'provenance.json'); json(installedPath, installed);
  const incoming = path.join(run, 'incoming/store-assets'); fs.cpSync(source, incoming, { recursive: true });
  const target = JSON.parse(read(path.join(incoming, 'provenance.json'))).upstream;
  target.evidence = 'Fictional supplied source copy; its template markers are observed, release/commit remain unestablished.';
  const entry = { id: 'manual-merge-current', recorded_at: facts.recorded_at, from: structuredClone(installed.upstream), to: target, status: 'in-progress', changes: [],
    conflicts: [{ path: 'northstar-notes-store-assets.md', issue: 'Local first-submission extension versus upstream updates-only scope', resolution: 'Pending — explicit retention decision required' }], verification: 'Pending — compare files and preservation inventories' };
  installed.upgrade_history.push(entry);
  write(path.join(kit, 'upgrading.md'), read(path.join(incoming, 'upgrading.md'))); entry.changes.push({ path: 'upgrading.md', action: 'add', reason: 'Previously absent toolkit guide' });
  entry.status = 'blocked'; json(installedPath, installed);
  check(JSON.stringify(installed.upstream) === JSON.stringify(unknownUpstream), 'Blocked upgrade preserves last integrated source');
  check(read(bookPath).includes(facts.local_extension) && stateSignature(kit) === stateBefore, 'Blocked comparison preserves local extension and all application state');
  const checkpoint = JSON.parse(read(installedPath)); check(checkpoint.upgrade_history.at(-1).conflicts[0].resolution.startsWith('Pending'), 'Next session can see pending target/conflict');

  // These are explicitly supplied fixture decisions, not a generic copy/upgrade algorithm.
  entry.status = 'in-progress'; entry.conflicts[0].resolution = facts.conflict_decision;
  for (const incomingFile of list(incoming)) {
    const relative = path.relative(incoming, incomingFile).split(path.sep).join('/');
    if (relative === 'provenance.json' || relative.endsWith('/.gitkeep') || /^(?:microsoft-store|apple-app-store|google-play)\/(?:current|release-prep|submissions)\//.test(relative)) continue;
    assert.ok(relative === 'README.md' || relative.endsWith('.md') || relative.startsWith('scripts/') || relative.startsWith('templates/') || relative.startsWith('microsoft-store/templates/'), 'Explicitly reviewed fixture toolkit scope: ' + relative);
    let content = fs.readFileSync(incomingFile);
    if (relative === 'store-assets-workflow.md') content = Buffer.from(content.toString('utf8') + '\n' + facts.workflow_adaptation + '\n');
    write(path.join(kit, relative), content);
    entry.changes.push({ path: relative, action: relative === 'store-assets-workflow.md' ? 'merge' : 'replace/add', reason: 'Explicit fictional per-path review; protected store state excluded' });
  }
  book = read(bookPath);
  const newTemplate = read(path.join(incoming, 'templates/store-rulebook.md.template'));
  const provenanceRules = newTemplate.match(/^The installed `provenance\.json`[^\r\n]+/m)[0];
  const sessionRules = newTemplate.match(/^For a fresh session[^\r\n]+/m)?.[0];
  book = book.replace('## 4. Directory responsibilities', provenanceRules + '\n\n' + (sessionRules ? sessionRules + '\n\n' : '') + '## 4. Directory responsibilities')
    .replace(/^├── checking\.md[^\r\n]+/m, line => line + '\n├── upgrading.md                  # manual merge rules\n├── provenance.json               # installed evidence/history')
    .replace(/^│   └── logo-assets\.md[^\r\n]+/m, line => line.replace('└──', '├──') + '\n│   ├── manual-upgrade.md          # fictional adaptation example\n│   └── session-handoff.md         # saved-state continuation example')
    .replace('When these rules change, this file is regenerated and the template version is bumped.', 'Initial generation evidence retained; later changes are merged deliberately under upgrading.md and recorded in provenance.json.');
  write(bookPath, book); entry.changes.push({ path: 'northstar-notes-store-assets.md', action: 'merge', reason: 'Integrate upgrade ownership/structure/footer; retain local marker, extension and original generation evidence' });
  check(read(bookPath).includes(facts.local_extension) && read(bookPath).includes('template_version: ' + facts.local_marker), 'Local extension and marker survive deliberate merge');
  check(!read(bookPath).includes('this file is regenerated') && read(bookPath).includes('version 1.5.0'), 'Unsafe regeneration instruction removed while initial generation evidence survives');
  check(read(path.join(kit, 'store-assets-workflow.md')).includes(facts.workflow_adaptation), 'Adapted workflow requirement is retained');
  check(stateSignature(kit) === stateBefore, 'All store current/candidate/submission paths and bytes remain identical');
  check(read(path.join(kit, 'local-notes.md')) === noteBefore && read(path.join(project, 'application.md')) === appBefore, 'Unclassified and external application files remain identical');
  check(git(project, ['show', baseline + ':store-assets/microsoft-store/current/en-US/listing.md']).equals(historicalListing), 'Prior immutable reference still resolves to original content');
  const beforeCheck = signature(project);
  const cli = spawnSync(process.execPath, [path.join(kit, 'scripts/check-store-assets.mjs'), '--root', kit, '--json'], { windowsHide: true, encoding: 'utf8' });
  const report = JSON.parse(cli.stdout);
  check(cli.status === 0, JSON.stringify(report));
  check(report.findings.some(finding => finding.code === 'RULEBOOK_VERSION'), 'Truthful local marker drift remains explicit review, not relabeling');
  check(report.findings.some(finding => finding.code === 'ASSET_INVENTORY_MISSING'), 'Legacy Logo mapping is pending application work, not automatically migrated');
  check(signature(project) === beforeCheck, 'Post-upgrade checker preserves all contents including Git metadata');
  entry.verification = 'Constructed artifact: state/unrelated hashes unchanged, historical reference readable, local rules/marker retained; checker exit 0 with reviewed drift/legacy gaps. Fresh-agent, origin authentication and release download not run.';
  entry.status = 'completed'; installed.upstream = structuredClone(target); json(installedPath, installed);
  const completed = JSON.parse(read(installedPath));
  check(completed.upstream.release === 'Unknown' && completed.upstream.commit === 'Unknown', 'Unknown incoming identity remains unknown');
  check(completed.upgrade_history.at(-1).from.template_versions['templates/store-rulebook.md.template'] === 'Unknown', 'Unknown original template version is not inferred from local marker or harness baseline');
  check(JSON.stringify(completed.upgrade_history[0]) === JSON.stringify(priorEntry) && completed.local_adaptations.length === 3, 'Earlier history and all adaptations survive');
  check(completed.upgrade_history.at(-1).status === 'completed' && !completed.upgrade_history.at(-1).conflicts[0].resolution.startsWith('Pending'), 'Completion retains supplied conflict resolution');
  check(stateSignature(kit) === stateBefore && signature(source) === sourceBefore, 'Completion leaves application state and repository kit unchanged');
  console.log('PASS: ' + passed + ' constructed-artifact/stamping assertions. Independent agent and real release download: not run.');
} finally {
  const resolved = fs.realpathSync(run), temp = fs.realpathSync(os.tmpdir()), relative = path.relative(temp, resolved);
  assert.ok(relative && !relative.includes(path.sep) && relative.startsWith('store-assets-i5-'), 'Refusing unsafe cleanup');
  fs.rmSync(resolved, { recursive: true, force: true });
  console.log('Cleanliness: scoped temporary application/incoming/build copies removed.');
}
