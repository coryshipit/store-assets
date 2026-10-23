// Constructed artifacts and copied-checker evidence, not an independent agent run.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const source = path.join(repo, 'starter-kit');
const fixtures = path.join(repo, 'tests/fixtures/session-handoff');
const matrix = JSON.parse(fs.readFileSync(path.join(fixtures, 'scenarios.json'), 'utf8'));
const run = fs.mkdtempSync(path.join(os.tmpdir(), 'store-assets-i6-'));
const kit = path.join(run, 'application/store-assets');
const when = '2026-10-23T17:00:00+08:00', id = '2026-10-23-logo-refresh';
let passed = 0;
function check(condition, message) { assert.ok(condition, message); passed++; }
function write(file, text) {
  const relative = path.relative(fs.realpathSync(run), path.resolve(file));
  assert.ok(relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text);
}
function read(file) { return fs.readFileSync(file, 'utf8'); }
function signature(directory) {
  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
      const file = path.join(dir, entry.name); assert.ok(!entry.isSymbolicLink(), 'Fixture contains ordinary files only');
      return entry.isDirectory() ? walk(file) : [path.relative(directory, file) + '|' + crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')];
    });
  }
  return walk(directory).join('\n');
}
function runChecker() {
  const before = signature(run);
  const result = spawnSync(process.execPath, [path.join(kit, 'scripts/check-store-assets.mjs'), '--root', kit, '--json'], { encoding: 'utf8', windowsHide: true });
  assert.ok(result.stdout, result.stderr || result.error?.message);
  const report = JSON.parse(result.stdout);
  check(result.status === report.exit_code, 'CLI and JSON exit codes agree');
  check(signature(run) === before, 'Copied checker leaves every run file unchanged');
  return report;
}
function event(number, kind, attempt, notes) {
  return ['### Event ' + number, 'Event: ' + kind, 'Attempt: ' + attempt, 'Occurred at: ' + when, 'Occurred timezone: +08:00',
    'Observed at: ' + when, 'Recorded at: ' + when, 'Source: Supplied fictional session facts; newly constructed operation only', 'Notes: ' + notes].join('\n');
}
function record(status = 'Draft') {
  const submitted = status === 'Submitted';
  const fields = { 'Submission ID': id, 'Draft created date': '2026-10-23', 'Submission date': submitted ? '2026-10-23' : '',
    'Released application version': '1.0.0', 'Application version': '1.0.0', 'Update type': 'listing-only', 'New package version': 'Not applicable',
    'Package evidence': 'Not applicable', 'Store submission ID': 'Pending — not reported', Locales: 'en-US', Status: status, 'Publication date': '', 'Publication confirmed date': '' };
  const attempts = submitted ? ['### Attempt 1', 'Snapshot commit: Pending — historical snapshot unlocated', 'Snapshot paths: Pending — scope unlocated',
    'Approval source: Pending — not supplied', 'Snapshot verification: Pending — unavailable', 'Verified at: Unknown'].join('\n') : 'None — not frozen or submitted';
  const events = event(1, 'draft-created', 'Not applicable', 'This new record does not establish original candidate creation time.') +
    (submitted ? '\n\n' + event(2, 'submitted', '1', 'Actual fictional submission report supplied; no go-live report.') : '');
  return ['# Northstar Notes Microsoft Store Submission — ' + id, '', ...Object.entries(fields).map(([key, value]) => key + ': ' + value),
    '', '## Changes', 'Confirmed separate listing-only Logo task; preserve existing candidate.', '', '## Submitted files', '- microsoft-store/release-prep/en-US',
    '', '## Submission attempts', attempts, '', '## Events', events, '', '## Open items', 'Original candidate creation time: Unknown. Source/role/visual/upload evidence remains unverified.',
    'Next required source: application owner supplies source/role review; store operator supplies actual field/upload observations and explicit go-live evidence when applicable.',
    '', '## Certification result', 'Unknown — no certification result supplied', '', '## Review notes',
    'Recovered association from explicit fixture task facts; candidate was not recopied. Continue independent inspection; dependent upload/promotion awaits its evidence.', ''].join('\n');
}

try {
  check(matrix.schema_version === 1 && matrix.scenarios.length === 10, 'Versioned matrix covers ten focused/lifecycle scenarios');
  check(new Set(matrix.scenarios.map(item => item.id)).size === matrix.scenarios.length, 'Scenario identities are unique');
  for (const scenario of matrix.scenarios) check(scenario.task && scenario.inputs && scenario.invariants.length && scenario.write_scope, 'Scenario supplies inputs/task/invariants/scope: ' + scenario.id);
  fs.cpSync(source, kit, { recursive: true });
  const template = read(path.join(kit, 'templates/store-rulebook.md.template'));
  let book = template;
  for (const [key, value] of Object.entries({ PRODUCT_NAME: 'Northstar Notes', STORE_PLATFORM: 'microsoft-store', STORE_DISPLAY_NAME: 'Microsoft Store', DEFAULT_LOCALE: 'en-US',
    CURRENT_APP_VERSION: '1.0.0', RULEBOOK_FILE: 'northstar-notes-store-assets.md', TEMPLATE_VERSION: template.match(/^template_version:\s*(.+)$/m)[1].trim() })) book = book.replaceAll('{{' + key + '}}', value);
  write(path.join(kit, 'northstar-notes-store-assets.md'), book);
  write(path.join(run, 'application/facts.md'), read(path.join(fixtures, 'facts.md')));
  fs.cpSync(path.join(repo, 'tests/fixtures/update-tasks/application/AGENTS.md'), path.join(run, 'application/AGENTS.md'));
  const current = path.join(kit, 'microsoft-store/current/en-US'), candidate = path.join(kit, 'microsoft-store/release-prep/en-US');
  fs.cpSync(path.join(repo, 'tests/fixtures/update-tasks/published'), current, { recursive: true }); fs.cpSync(current, candidate, { recursive: true });
  write(path.join(candidate, 'logos/store-logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><desc>Unmapped synthetic candidate; original creation time unknown</desc></svg>\n');
  const inactiveId = '2026-10-23-z-prior-withdrawn';
  write(path.join(kit, 'microsoft-store/submissions', inactiveId + '.md'), '# Northstar Notes Microsoft Store Submission — ' + inactiveId +
    '\nSubmission ID: ' + inactiveId + '\nStatus: Withdrawn\nLocales: en-US\nUpdate type: listing-only\nReleased application version: 1.0.0\nApplication version: 1.0.0\nNew package version: Not applicable\nPackage evidence: Not applicable\n\n## Review notes\nInactive fictional record; no ownership of the new candidate is supplied.\n');
  const currentBefore = signature(current), candidateBefore = signature(candidate);
  const orphan = runChecker();
  check(orphan.exit_code === 1 && orphan.findings.some(item => item.code === 'ORPHAN_CANDIDATE'), 'Read-only orphan detection does not infer ownership from inactive record');
  check(!fs.existsSync(path.join(kit, 'microsoft-store/submissions', id + '.md')), 'Checker does not invent missing recovery identity/Draft');
  const activeFile = path.join(kit, 'microsoft-store/submissions', id + '.md'); write(activeFile, record());
  const recovered = runChecker();
  check(recovered.exit_code === 0 && !recovered.findings.some(item => item.code === 'ORPHAN_CANDIDATE'), 'Expressly confirmed recovery record owns preserved complete candidate');
  check(!recovered.findings.some(item => item.code === 'MULTIPLE_ACTIVE'), 'Newer-filename inactive record is not another active owner');
  check(signature(current) === currentBefore && signature(candidate) === candidateBefore, 'Recovery preserves all current and candidate bytes');
  check(read(activeFile).includes('Original candidate creation time: Unknown') && read(activeFile).includes('Next required source:'), 'Saved record retains missing time and next evidence source');
  check(read(activeFile).includes('New package version: Not applicable') && read(activeFile).includes('Application version: 1.0.0'), 'Listing-only applicability is retained');
  write(activeFile, read(activeFile) + '\nCheck scope: copied node scripts/check-store-assets.mjs --root . --json; exit 0 with legacy/source review gaps; fixture recording time ' + when + '. No source/visual/upload approval established.\n');
  const mapping = ['\n### Field handoff', 'Interface language: zh-CN', 'Customer locales: en-US', 'Observed field/section: Pending — no label supplied',
    'Canonical destination: Pending — verify actual field before upload', 'Value source: microsoft-store/release-prep/en-US/listing.md#product-description',
    'Source and reviewed date: fictional operator language report in facts.md; 2026-10-23', 'Next action: obtain actual field observation; keep canonical listing text at Value source.', ''].join('\n');
  write(activeFile, read(activeFile) + mapping);
  const mapped = runChecker(); check(mapped.exit_code === 0, 'Existing-record interface mapping remains parseable');
  check(read(activeFile).includes('Locales: en-US') && !fs.existsSync(path.join(kit, 'microsoft-store/release-prep/zh-CN')), 'Interface language does not create another customer locale');
  check(read(path.join(candidate, 'listing.md')).includes('## Product description'), 'Canonical mapping target field exists');
  const canonical = read(path.join(candidate, 'listing.md')).match(/## Product description\r?\n([\s\S]*?)(?:\r?\n##|$)/)[1].trim();
  check(canonical.length > 0 && !read(activeFile).includes(canonical), 'Handoff references canonical copy without duplicating it');
  check(read(activeFile).includes('Pending — no label supplied'), 'Unobserved translated label remains pending');
  write(activeFile, record('Submitted') + mapping);
  const submitted = runChecker();
  check(submitted.exit_code === 0 && submitted.findings.some(item => item.code === 'SNAPSHOT_PENDING'), 'Saved Submitted variant exposes its missing historical snapshot');
  check(read(activeFile).includes('Status: Submitted') && !/Event: (go-live-confirmed|promoted)/.test(read(activeFile)), 'Constructed no-confirmation artifact has no publication/promotion event');
  check(signature(current) === currentBefore && signature(candidate) === candidateBefore, 'Submitted handoff leaves frozen candidate/live baseline unchanged');
  check(!fs.existsSync(path.join(kit, 'handoff.md')) && !fs.existsSync(path.join(kit, 'status.md')), 'All handoff content stays in existing record, not a parallel status file');
  console.log('PASS: ' + passed + ' fixture/artifact/copied-checker assertions. Ten independent agent scenarios: not run.');
} finally {
  const resolved = fs.realpathSync(run), relative = path.relative(fs.realpathSync(os.tmpdir()), resolved);
  assert.ok(relative && !relative.includes(path.sep) && relative.startsWith('store-assets-i6-'), 'Refusing unsafe cleanup');
  fs.rmSync(resolved, { recursive: true, force: true });
  console.log('Cleanliness: scoped temporary project/artifacts removed.');
}
