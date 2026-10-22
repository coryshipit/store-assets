import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkStoreAssets } from '../starter-kit/scripts/check-store-assets.mjs';

const kitSource = fileURLToPath(new URL('../starter-kit/', import.meta.url));
const published = fileURLToPath(new URL('./fixtures/update-tasks/published/', import.meta.url));
const cli = path.join(kitSource, 'scripts/check-store-assets.mjs');
const tick = String.fromCharCode(96);
const time = '2026-10-23T10:00:00+08:00';
function write(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); }
function removeInside(project, target) {
  const relative = path.relative(fs.realpathSync(project), fs.realpathSync(target));
  assert.ok(relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
  fs.rmSync(target, { recursive: true });
}
function fixture(t, initialized = true) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'store-assets-check-'));
  t.after(() => {
    const resolved = fs.realpathSync(project), temp = fs.realpathSync(os.tmpdir());
    assert.ok(path.relative(temp, resolved).startsWith('store-assets-check-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  const root = path.join(project, 'store-assets');
  fs.cpSync(kitSource, root, { recursive: true });
  if (initialized) {
    let book = fs.readFileSync(path.join(root, 'templates/store-rulebook.md.template'), 'utf8');
    const version = book.match(/^template_version: (.+)$/m)[1].trim();
    for (const [key, value] of Object.entries({ PRODUCT_NAME: 'Northstar Notes', STORE_PLATFORM: 'microsoft-store', STORE_DISPLAY_NAME: 'Microsoft Store',
      DEFAULT_LOCALE: 'en-US', CURRENT_APP_VERSION: '1.0.0', RULEBOOK_FILE: 'northstar-notes-store-assets.md', TEMPLATE_VERSION: version })) book = book.replaceAll('{{' + key + '}}', value);
    write(path.join(root, 'northstar-notes-store-assets.md'), book);
  }
  const current = path.join(root, 'microsoft-store/current/en-US');
  fs.cpSync(published, current, { recursive: true });
  const candidate = path.join(root, 'microsoft-store/release-prep/en-US');
  return { project, root, current, candidate };
}
function candidate(f) { fs.cpSync(f.current, f.candidate, { recursive: true }); }
function event(id, kind, attempt = 'Not applicable', occurred = time, notes = '') {
  return { id, kind, attempt, occurred, observed: time, recorded: time, source: 'Dated fictional user/local event evidence', notes };
}
function record(f, { id = '2026-10-23-logo-refresh', fields = {}, attempts = [], events = [event(1, 'draft-created')], refs = ['microsoft-store/release-prep/en-US'], open = 'None' } = {}) {
  const latest = kind => [...events].reverse().find(item => item.kind === kind);
  const date = input => input && /^\d{4}-\d{2}-\d{2}/.test(input) ? input.slice(0, 10) : '';
  const header = { 'Submission ID': id, 'Draft created date': date(latest('draft-created')?.occurred), 'Submission date': date(latest('submitted')?.occurred),
    'Released application version': '1.0.0', 'Application version': '1.0.0', 'Update type': 'listing-only', 'New package version': 'Not applicable',
    'Package evidence': 'Not applicable', 'Store submission ID': 'Pending — not reported by the store', Locales: 'en-US', Status: 'Draft',
    'Publication date': date(latest('platform-published')?.occurred), 'Publication confirmed date': date(latest('go-live-confirmed')?.observed), ...fields };
  const lines = ['# Northstar Notes Microsoft Store Submission — ' + id, '', ...Object.entries(header).map(([key, value]) => key + ':' + (value ? ' ' + value : '')),
    '', '## Changes', '', 'Confirmed fictional listing-only asset change.', '', '## Submitted files', '',
    ...refs.map(ref => '- ' + tick + ref + tick + ' — candidate navigation; history in attempts'), '', '## Submission attempts', ''];
  if (!attempts.length) lines.push('None — not frozen or submitted');
  for (const item of attempts) lines.push('### Attempt ' + item.id, 'Snapshot commit: ' + item.commit, 'Snapshot paths:',
    ...(item.paths || ['store-assets/microsoft-store/release-prep/en-US']).map(name => '- ' + name),
    'Approval source: dated fictional approval of complete candidate', 'Snapshot verification: ' + (item.verification || 'Verified'),
    'Verified at: ' + time, '');
  lines.push('', '## Events', '');
  for (const item of events) lines.push('### Event ' + item.id, 'Event: ' + item.kind, 'Attempt: ' + item.attempt, 'Occurred at: ' + item.occurred,
    'Occurred timezone: +08:00', 'Observed at: ' + item.observed, 'Recorded at: ' + item.recorded, 'Source: ' + item.source, 'Notes: ' + item.notes, '');
  lines.push('## Open items', '', open, '', '## Certification result', '', 'Only supplied fixture reports.', '', '## Review notes', '', 'Fictional record.', '');
  const file = path.join(f.root, 'microsoft-store/submissions', id + '.md');
  write(file, lines.join('\n')); return file;
}
function git(f, ...args) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=' + path.join(f.project, 'empty-hooks'), '-c', 'commit.gpgsign=false', '-C', f.project, ...args],
    { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout.trim();
}
function init(f, format = 'sha1') {
  fs.mkdirSync(path.join(f.project, 'empty-hooks'));
  git(f, 'init', '--quiet', '--initial-branch=main', '--object-format=' + format);
  git(f, 'config', 'user.name', 'Fixture');
  git(f, 'config', 'user.email', 'fixture@example.invalid');
  git(f, 'config', 'core.autocrlf', 'false');
  write(path.join(f.project, '.gitattributes'), '* text=auto eol=lf\n');
  write(path.join(f.project, '.gitignore'), '*.ignored\n');
  git(f, 'add', '--all'); git(f, 'commit', '--quiet', '-m', 'Fixture baseline');
}
function freeze(f) {
  git(f, 'add', '--all', '--', 'store-assets/microsoft-store/release-prep');
  git(f, 'commit', '--quiet', '-m', 'Approved complete candidate');
  return git(f, 'rev-parse', 'HEAD');
}
function submitted(f, commit, extra = {}) {
  return record(f, { fields: { Status: 'Submitted' }, attempts: [{ id: 1, commit }],
    events: [event(1, 'draft-created'), event(2, 'submitted', '1')], ...extra });
}
const codes = report => report.findings.map(item => item.code);
function contains(report, code) { assert.ok(codes(report).includes(code), JSON.stringify(report, null, 2)); }
function tree(root) {
  const rows = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir).sort()) {
      const name = path.join(dir, entry), stat = fs.lstatSync(name), relative = path.relative(root, name);
      if (stat.isSymbolicLink()) rows.push(relative + '|link|' + fs.readlinkSync(name));
      else if (stat.isDirectory()) walk(name);
      else rows.push(relative + '|' + crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex'));
    }
  }
  walk(root); return rows;
}

test('unused standalone kit and reserved adapters have no orphan candidates', t => {
  const f = fixture(t, false), report = checkStoreAssets(f.root);
  assert.equal(report.exit_code, 0); contains(report, 'NO_SUBMISSION');
});
test('valid initialized kit needs no Draft when candidate is empty', t => {
  const f = fixture(t); assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('valid listing-only Draft needs no new package or frozen attempt', t => {
  const f = fixture(t); candidate(f); record(f);
  const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0, JSON.stringify(report)); assert.equal(report.counts.error, 0);
});
test('orphan Logo candidate is located without changes', t => {
  const f = fixture(t); candidate(f); const before = tree(f.project), report = checkStoreAssets(f.root);
  assert.equal(report.exit_code, 1); contains(report, 'ORPHAN_CANDIDATE'); assert.deepEqual(tree(f.project), before);
});
test('two active records cannot claim the same candidate', t => {
  const f = fixture(t); candidate(f); record(f); record(f, { id: '2026-10-23-second-update' });
  const report = checkStoreAssets(f.root); contains(report, 'MULTIPLE_ACTIVE'); contains(report, 'CANDIDATE_OWNERSHIP'); assert.equal(report.exit_code, 1);
});
test('invalid status and duplicate header fields produce findings', t => {
  const f = fixture(t); candidate(f); const file = record(f, { fields: { Status: 'Ready' } });
  fs.appendFileSync(file, '\n');
  write(file, fs.readFileSync(file, 'utf8').replace('## Changes', 'Status: Draft\n\n## Changes'));
  const report = checkStoreAssets(f.root); contains(report, 'STATUS'); contains(report, 'DUPLICATE_FIELD');
});
test('a required modern field cannot disappear silently', t => {
  const f = fixture(t); candidate(f); const file = record(f);
  write(file, fs.readFileSync(file, 'utf8').replace(/^Package evidence:.*\n/m, ''));
  contains(checkStoreAssets(f.root), 'MISSING_FIELD');
});
test('referenced missing image gives its record path and line', t => {
  const f = fixture(t); candidate(f); record(f, { refs: ['microsoft-store/release-prep/en-US/logos/missing.png'] });
  const report = checkStoreAssets(f.root); contains(report, 'FILE_MISSING');
  const finding = report.findings.find(item => item.code === 'FILE_MISSING');
  assert.ok(finding.path.endsWith('.md') && finding.line > 1);
});
test('missing local image in listing is caught', t => {
  const f = fixture(t); candidate(f); record(f);
  fs.appendFileSync(path.join(f.candidate, 'listing.md'), '\n![Logo](logos/missing.png)\n');
  contains(checkStoreAssets(f.root), 'ASSET_LINK_MISSING');
});
test('URL-escaped local links and titles work while code examples stay literal', t => {
  const f = fixture(t); candidate(f); record(f); write(path.join(f.candidate, 'logos/new logo.png'), 'marker');
  fs.appendFileSync(path.join(f.candidate, 'listing.md'), '\n![Logo](logos/new%20logo.png "Title")\n' + tick + '![example](not-a-real-file.png)' + tick + '\n');
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('static README placeholder and rulebook source drift are distinguished', t => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.root, 'README.md'), '\n{{PRODUCT_NAME}}\n');
  const book = path.join(f.root, 'northstar-notes-store-assets.md');
  write(book, fs.readFileSync(book, 'utf8').replace(/^template_version:.+$/m, 'template_version: local-adaptation'));
  const report = checkStoreAssets(f.root); contains(report, 'STATIC_README_TOKEN'); contains(report, 'RULEBOOK_VERSION');
});
test('declared locales and candidate references must agree', t => {
  const f = fixture(t); candidate(f); record(f, { fields: { Locales: 'fr-FR' } });
  const report = checkStoreAssets(f.root); contains(report, 'LOCALE_SCOPE'); contains(report, 'LOCALE_CANDIDATE_MISSING');
});
test('generated project tokens are errors; rulebook skeleton tokens remain allowed', t => {
  const f = fixture(t); candidate(f); const file = record(f);
  fs.appendFileSync(file, '\nUnresolved {{PRODUCT_NAME}}\n');
  fs.appendFileSync(path.join(f.candidate, 'listing.md'), '\n{{LOCALE}}\n');
  const report = checkStoreAssets(f.root); contains(report, 'UNRESOLVED_TOKEN');
  assert.ok(!report.findings.some(item => item.code === 'UNRESOLVED_TOKEN' && item.path === 'northstar-notes-store-assets.md'));
});
test('listing-only version or new-package applicability errors are detected', t => {
  const f = fixture(t); candidate(f); record(f, { fields: { 'Application version': '1.1.0', 'New package version': '1.1.0.0' } });
  const report = checkStoreAssets(f.root); contains(report, 'LISTING_VERSION'); contains(report, 'PACKAGE_APPLICABILITY');
});
test('package evidence can be pending without fabricated facts or structural rejection', t => {
  const f = fixture(t); candidate(f); record(f, { fields: { 'Update type': 'package-update', 'Application version': '1.1.0',
    'New package version': 'Pending — package not built', 'Package evidence': 'Pending — QA evidence unavailable' } });
  const before = tree(f.project), report = checkStoreAssets(f.root);
  assert.equal(report.exit_code, 0, JSON.stringify(report)); contains(report, 'PACKAGE_PENDING'); assert.deepEqual(tree(f.project), before);
});
test('package updates cannot hide missing evidence as not applicable', t => {
  const f = fixture(t); candidate(f); record(f, { fields: { 'Update type': 'package-update' } });
  contains(checkStoreAssets(f.root), 'PACKAGE_APPLICABILITY');
});
test('intentional candidate additions/removals are allowed before freezing', t => {
  const f = fixture(t); candidate(f); record(f);
  fs.unlinkSync(path.join(f.candidate, 'logos/store-logo.svg')); write(path.join(f.candidate, 'logos/replacement.svg'), '<svg/>');
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('shared asset root does not become an invented locale', t => {
  const f = fixture(t); candidate(f); write(path.join(f.root, 'microsoft-store/release-prep/logos/shared.png'), 'fictional marker');
  record(f, { refs: ['microsoft-store/release-prep/en-US', 'microsoft-store/release-prep/logos/shared.png'] });
  const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0, JSON.stringify(report));
});
test('quoted file references support spaces and UTF-8/BOM/CRLF records', t => {
  const f = fixture(t); candidate(f); write(path.join(f.candidate, 'logos/new logo.png'), 'marker');
  const file = record(f, { refs: ['microsoft-store/release-prep/en-US/logos/new logo.png'] });
  write(file, '\uFEFF' + fs.readFileSync(file, 'utf8').replaceAll('\n', '\r\n'));
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('legacy published record remains reviewable without invented migration', t => {
  const f = fixture(t), file = path.join(f.root, 'microsoft-store/submissions/2026-10-09-legacy.md');
  write(file, '# Historical fixture\n\nSubmission ID: 2026-10-09-legacy\nApplication version: 1.0.0\nUpdate type: listing refresh\nLocales: en-US\nStatus: Published\nPublication date: 2026-10-09\n\n## Submitted files\n\n- microsoft-store/current/en-US/listing.md\n');
  const before = tree(f.project), report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0, JSON.stringify(report)); contains(report, 'LEGACY_RECORD'); assert.deepEqual(tree(f.project), before);
});
test('unparseable legacy state remains an explicit review gap instead of being invented', t => {
  const f = fixture(t), file = path.join(f.root, 'microsoft-store/submissions/2026-10-09-unstructured.md');
  write(file, '# Historical fixture\n\nSubmission ID: 2026-10-09-unstructured\nLocales: en-US\n\n## Review notes\n\nOriginal status cannot be established from this record.\n');
  const before = tree(f.project), report = checkStoreAssets(f.root);
  assert.equal(report.exit_code, 0); contains(report, 'LEGACY_RECORD'); contains(report, 'STATUS'); assert.deepEqual(tree(f.project), before);
});
test('explicit pending snapshot keeps incomplete Draft work possible', t => {
  const f = fixture(t); candidate(f); record(f, { attempts: [{ id: 1, commit: 'Pending — not committed', verification: 'Pending — no snapshot' }] });
  const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0); contains(report, 'SNAPSHOT_PENDING');
});
test('snapshot checks need Git while ordinary Draft checks do not', t => {
  const f = fixture(t); candidate(f); record(f, { attempts: [{ id: 1, commit: 'a'.repeat(40) }] });
  const report = checkStoreAssets(f.root, { gitExecutable: path.join(f.project, 'no-such-git') });
  assert.equal(report.exit_code, 2); contains(report, 'GIT_UNAVAILABLE');
});
test('a real full snapshot and candidate are checked without writing Git index/objects', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f); submitted(f, commit);
  const before = tree(f.project), report = checkStoreAssets(f.root);
  assert.equal(report.exit_code, 0, JSON.stringify(report)); assert.deepEqual(tree(f.project), before);
});
test('SHA-256 repository snapshots are supported without assuming SHA-1 length', t => {
  const f = fixture(t); init(f, 'sha256'); candidate(f); const commit = freeze(f); submitted(f, commit);
  assert.equal(commit.length, 64); assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('abbreviated or moving snapshot references are rejected', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f); submitted(f, commit.slice(0, 8));
  contains(checkStoreAssets(f.root), 'SNAPSHOT_ID');
  submitted(f, 'HEAD'); contains(checkStoreAssets(f.root), 'SNAPSHOT_ID');
});
test('missing commit and missing historical path are distinct structural findings', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f);
  submitted(f, 'a'.repeat(40)); contains(checkStoreAssets(f.root), 'SNAPSHOT_MISSING');
  submitted(f, commit, { attempts: [{ id: 1, commit, paths: ['store-assets/microsoft-store/release-prep/en-US/missing'] }] });
  contains(checkStoreAssets(f.root), 'SNAPSHOT_PATH_MISSING');
});
test('one changed image is not a complete locale snapshot', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f);
  submitted(f, commit, { attempts: [{ id: 1, commit, paths: ['store-assets/microsoft-store/release-prep/en-US/logos/store-logo.svg'] }] });
  contains(checkStoreAssets(f.root), 'SNAPSHOT_LOCALE_SCOPE');
});
test('changed frozen content and extra untracked/ignored files are detected without git status', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f); submitted(f, commit);
  fs.appendFileSync(path.join(f.candidate, 'logos/store-logo.svg'), '\nUnapproved change');
  write(path.join(f.candidate, 'extra.png'), 'untracked marker'); write(path.join(f.candidate, 'extra.ignored'), 'ignored marker');
  const before = tree(f.project), report = checkStoreAssets(f.root);
  contains(report, 'CANDIDATE_SNAPSHOT_DIFF'); contains(report, 'CANDIDATE_NOT_FROZEN'); assert.equal(report.exit_code, 1); assert.deepEqual(tree(f.project), before);
});
test('new Draft edits after rejection require review rather than frozen-content rejection', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f);
  record(f, { attempts: [{ id: 1, commit }], events: [event(1, 'draft-created'), event(2, 'submitted', '1'), event(3, 'status-observed', '1', 'Unknown', 'Status: Rejected; review fixes requested'), event(4, 'draft-reopened', '1')] });
  fs.appendFileSync(path.join(f.candidate, 'logos/store-logo.svg'), '\nApproved fix still being prepared');
  const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0, JSON.stringify(report)); contains(report, 'CANDIDATE_SNAPSHOT_DIFF');
});
test('a newly approved Draft uses its latest snapshot instead of the earlier submitted attempt', t => {
  const f = fixture(t); init(f); candidate(f); const first = freeze(f);
  fs.appendFileSync(path.join(f.candidate, 'logos/store-logo.svg'), '\nApproved corrected candidate');
  const second = freeze(f);
  record(f, { attempts: [{ id: 1, commit: first }, { id: 2, commit: second }],
    events: [event(1, 'draft-created'), event(2, 'submitted', '1'), event(3, 'status-observed', '1', 'Unknown', 'Status: Rejected; fixes confirmed'), event(4, 'draft-reopened', '1')] });
  const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0); assert.ok(!codes(report).includes('CANDIDATE_SNAPSHOT_DIFF'));
});
test('an unknown latest published attempt never falls back to a convenient older snapshot', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f);
  fs.appendFileSync(path.join(f.candidate, 'logos/store-logo.svg'), '\nUnreconciled later local content');
  record(f, { fields: { Status: 'Published' }, attempts: [{ id: 1, commit }],
    events: [event(1, 'draft-created'), event(2, 'submitted', '1'), event(3, 'go-live-confirmed', 'Unknown')] });
  const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0, JSON.stringify(report));
  contains(report, 'CANDIDATE_ATTEMPT_UNKNOWN'); assert.ok(!codes(report).includes('CANDIDATE_SNAPSHOT_DIFF'));
});
test('Git text normalization is distinct from binary bytes', t => {
  const f = fixture(t); init(f); candidate(f);
  const listing = path.join(f.candidate, 'listing.md'); write(listing, fs.readFileSync(listing, 'utf8').replaceAll('\n', '\r\n'));
  const commit = freeze(f); submitted(f, commit);
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('external clean filters are never executed by comparison', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f); submitted(f, commit);
  git(f, 'config', 'filter.fixture.clean', 'this-filter-must-not-run');
  fs.appendFileSync(path.join(f.project, '.gitattributes'), 'store-assets/microsoft-store/release-prep/** filter=fixture\n');
  fs.appendFileSync(path.join(f.candidate, 'logos/store-logo.svg'), '\nChanged filtered file');
  const before = tree(f.project), report = checkStoreAssets(f.root);
  contains(report, 'FILTERED_CONTENT'); assert.deepEqual(tree(f.project), before); assert.ok(!codes(report).includes('CHECK_INCOMPLETE'));
});
test('Published can have unknown platform date and archived prep removed', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f);
  const events = [event(1, 'draft-created'), event(2, 'submitted', '1', 'Unknown'), event(3, 'go-live-confirmed', '1'), event(4, 'promoted', '1')];
  record(f, { fields: { Status: 'Published' }, attempts: [{ id: 1, commit }], events });
  removeInside(f.project, f.candidate); git(f, 'add', '--all'); git(f, 'commit', '--quiet', '-m', 'Archive');
  const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0, JSON.stringify(report)); assert.ok(!codes(report).includes('FILE_MISSING'));
});
test('historical missing file is checked in its snapshot instead of current', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f);
  record(f, { fields: { Status: 'Published' }, attempts: [{ id: 1, commit }], events: [event(1, 'draft-created'), event(2, 'go-live-confirmed', '1'), event(3, 'promoted', '1')],
    refs: ['microsoft-store/release-prep/en-US/never-submitted.png'] });
  removeInside(f.project, f.candidate); contains(checkStoreAssets(f.root), 'HISTORICAL_FILE_MISSING');
});
test('historical Markdown link gaps are reviewed from stored content', t => {
  const f = fixture(t); init(f); candidate(f);
  fs.appendFileSync(path.join(f.candidate, 'listing.md'), '\n![Logo](logos/not-in-snapshot.png)\n');
  const commit = freeze(f);
  record(f, { fields: { Status: 'Published' }, attempts: [{ id: 1, commit }], events: [event(1, 'draft-created'), event(2, 'go-live-confirmed', '1'), event(3, 'promoted', '1')] });
  removeInside(f.project, f.candidate);
  const report = checkStoreAssets(f.root); contains(report, 'HISTORICAL_ASSET_LINK'); assert.equal(report.exit_code, 0);
});
test('a sourced current-tree snapshot still compares against a submitted candidate', t => {
  const f = fixture(t); init(f); candidate(f); const commit = git(f, 'rev-parse', 'HEAD');
  submitted(f, commit, { attempts: [{ id: 1, commit, paths: ['store-assets/microsoft-store/current/en-US'] }] });
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
  fs.appendFileSync(path.join(f.candidate, 'logos/store-logo.svg'), '\nUnapproved later content');
  contains(checkStoreAssets(f.root), 'CANDIDATE_SNAPSHOT_DIFF');
});
test('shallow missing history is incomplete, never replaced by HEAD or fetched', t => {
  const f = fixture(t); init(f); candidate(f); const commit = freeze(f);
  record(f, { fields: { Status: 'Published' }, attempts: [{ id: 1, commit }], events: [event(1, 'draft-created'), event(2, 'go-live-confirmed', '1'), event(3, 'promoted', '1')] });
  removeInside(f.project, f.candidate); git(f, 'add', '--all'); git(f, 'commit', '--quiet', '-m', 'Archive');
  const clone = path.join(f.project, 'shallow-copy');
  git(f, 'clone', '--quiet', '--depth', '1', '--no-local', pathToFileURL(f.project).href, clone);
  const before = tree(clone), report = checkStoreAssets(path.join(clone, 'store-assets'));
  assert.equal(report.exit_code, 2); contains(report, 'SNAPSHOT_NOT_LOCAL'); assert.deepEqual(tree(clone), before);
});
test('promotion without its corresponding confirmation is a local transition error', t => {
  const f = fixture(t); candidate(f); record(f, { attempts: [{ id: 1, commit: 'Pending — missing history' }],
    events: [event(1, 'draft-created'), event(2, 'promoted', '1')] });
  contains(checkStoreAssets(f.root), 'PROMOTION_CONFIRMATION');
});
test('returning Published to Draft is not a valid review-fix transition', t => {
  const f = fixture(t); candidate(f); record(f, { attempts: [{ id: 1, commit: 'Pending — missing history' }],
    events: [event(1, 'draft-created'), event(2, 'go-live-confirmed', '1'), event(3, 'draft-reopened', '1')] });
  contains(checkStoreAssets(f.root), 'ILLEGAL_LOCAL_TRANSITION');
});
test('summary dates cannot borrow an unknown event occurrence from observation', t => {
  const f = fixture(t); candidate(f); record(f, { fields: { Status: 'Submitted', 'Submission date': '2026-10-23' }, attempts: [{ id: 1, commit: 'Pending — historical assets unknown' }],
    events: [event(1, 'draft-created'), event(2, 'submitted', '1', 'Unknown')] });
  contains(checkStoreAssets(f.root), 'DATE_SOURCE');
});
test('Published pending promotion is an owner and blocks a new active preparation', t => {
  const f = fixture(t); candidate(f); record(f, { fields: { Status: 'Published' }, attempts: [{ id: 1, commit: 'Pending — unavailable approved snapshot' }],
    events: [event(1, 'draft-created'), event(2, 'go-live-confirmed', '1')] });
  let report = checkStoreAssets(f.root); assert.ok(!codes(report).includes('ORPHAN_CANDIDATE')); contains(report, 'SNAPSHOT_PENDING');
  record(f, { id: '2026-10-23-second-update' }); report = checkStoreAssets(f.root); contains(report, 'ARCHIVE_CONFLICT');
});
test('unsafe relative references do not escape the kit', t => {
  const f = fixture(t); candidate(f); record(f, { refs: ['../outside.png'] });
  const before = tree(f.project), report = checkStoreAssets(f.root); contains(report, 'PATH_SCOPE'); assert.deepEqual(tree(f.project), before);
});
test('directory junctions/symlinks are reported without following them', t => {
  const f = fixture(t), external = path.join(f.project, 'unrelated'), target = path.join(f.root, 'microsoft-store/release-prep/en-US');
  fs.mkdirSync(external); write(path.join(external, 'private.md'), '{{MUST_NOT_READ}}');
  fs.symlinkSync(external, target, process.platform === 'win32' ? 'junction' : 'dir');
  const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 2); contains(report, 'LINK_UNCHECKED');
  assert.ok(!codes(report).includes('UNRESOLVED_TOKEN'));
});
test('CLI root is explicit and only Microsoft adapter is executable', t => {
  const f = fixture(t);
  for (const args of [[], ['--root', f.project], ['--root', f.root, '--store', 'apple-app-store']]) {
    const result = spawnSync(process.execPath, [cli, '--json', ...args], { encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 2); assert.equal(JSON.parse(result.stdout).exit_code, 2);
  }
});
test('copied script operates standalone through CLI and creates no files', t => {
  const f = fixture(t); candidate(f); record(f);
  const before = tree(f.project), copied = path.join(f.root, 'scripts/check-store-assets.mjs');
  const result = spawnSync(process.execPath, [copied, '--root', f.root, '--json'], { cwd: os.tmpdir(), encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout); assert.equal(JSON.parse(result.stdout).exit_code, 0); assert.deepEqual(tree(f.project), before);
});
