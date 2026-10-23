import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { deflateSync } from 'node:zlib';
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
  const f = fixture(t); candidate(f); logo(f, { scope: 'en-US' }); record(f);
  const before = tree(f.project), copied = path.join(f.root, 'scripts/check-store-assets.mjs');
  const result = spawnSync(process.execPath, [copied, '--root', f.root, '--json'], { cwd: os.tmpdir(), encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr || result.stdout); assert.equal(JSON.parse(result.stdout).exit_code, 0); assert.deepEqual(tree(f.project), before);
});

// Synthetic PNG bytes are fixture data, never product artwork or visual approval.
function png(width, height) {
  function chunk(type, data) {
    const body = Buffer.concat([Buffer.from(type), data]), size = Buffer.alloc(4), crc = Buffer.alloc(4);
    size.writeUInt32BE(data.length); let sum = 0xffffffff;
    for (const byte of body) {
      sum ^= byte;
      for (let bit = 0; bit < 8; bit++) sum = (sum >>> 1) ^ ((sum & 1) ? 0xedb88320 : 0);
    }
    crc.writeUInt32BE((sum ^ 0xffffffff) >>> 0); return Buffer.concat([size, body, crc]);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.alloc(height * (width * 3 + 1)))), chunk('IEND', Buffer.alloc(0))]);
}
function logo(f, { scope = 'shared', locales = ['en-US'], route = 'msix', role = 'msix-app-tile', width = 300, height = 300 } = {}) {
  const base = 'microsoft-store/release-prep/' + scope, file = path.join(f.root, base, 'asset-inventory.json');
  const destinations = { 'msix-app-tile': '1:1 App tile icon', 'msi-exe-box': '1:1 box art', 'msi-exe-poster': '2:3 poster art' };
  const asset = { id: 'store-logo', role, destination: 'Store listings > Store logos > ' + destinations[role], locales,
    source: base + '/logos/source/mark.svg', source_provenance: 'Fictional supplied source; permission recorded by fixture',
    export: base + '/logos/export/store-logo.png', width, height, format: 'png', transparency: 'absent',
    generation_method: 'Synthetic fixture PNG; no artistic/visual approval',
    requirements_source: 'https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/' + (route === 'msix' ? 'msix' : 'msi') + '/screenshots-and-images#store-logos',
    requirements_reviewed: '2026-10-23', review: { visual: 'pending', evidence: 'Pending — human inspection' } };
  const inventory = { schema_version: 1, template_version: '1.0.0', package_type: route, product_type: 'app', device_family: 'Desktop', assets: [asset] };
  write(path.join(f.root, asset.source), '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300"/></svg>');
  const image = path.join(f.root, asset.export); write(image, png(width, height));
  const save = () => write(file, JSON.stringify(inventory, null, 2)); save();
  return { file, inventory, asset, image, save, base };
}
function logoDraft(f, scopes = ['en-US', 'shared'], options = {}) {
  candidate(f); return record(f, { refs: scopes.map(scope => 'microsoft-store/release-prep/' + scope), ...options });
}

test('shared MSIX Logo maps consumers and remains read-only with pending visual review', t => {
  const f = fixture(t); logoDraft(f); logo(f); init(f);
  const before = tree(f.project), report = checkStoreAssets(f.root);
  assert.equal(report.exit_code, 0, JSON.stringify(report)); contains(report, 'ASSET_VISUAL_REVIEW'); assert.deepEqual(tree(f.project), before);
});
test('localized Logo has a single localized consumer and needs no shared scope', t => {
  const f = fixture(t); logoDraft(f, ['en-US']); logo(f, { scope: 'en-US' });
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('MSI/EXE roles use their own aspect ratio and leave pixel acceptance for review', t => {
  for (const [role, width, height] of [['msi-exe-box', 256, 256], ['msi-exe-poster', 200, 300]]) {
    const f = fixture(t); logoDraft(f); logo(f, { role, width, height, route: 'msi-exe' });
    const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0, JSON.stringify(report)); contains(report, 'ASSET_REQUIREMENTS_REVIEW');
    assert.ok(!codes(report).includes('ASSET_MSIX_TILE'));
  }
});
test('MSIX app tile role cannot be silently assigned to an MSI/EXE application', t => {
  const f = fixture(t); logoDraft(f); logo(f, { route: 'msi-exe' }); contains(checkStoreAssets(f.root), 'ASSET_ROLE_PROFILE');
});
test('known role destination must match its verified upload field', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f); l.asset.destination = 'Packages > StoreLogo'; l.save();
  contains(checkStoreAssets(f.root), 'ASSET_DESTINATION');
});
test('game and unknown roles receive review without borrowed app tile constraints', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f, { width: 256, height: 256 });
  l.inventory.product_type = 'game'; l.save();
  let report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0); contains(report, 'ASSET_PROFILE_REVIEW'); assert.ok(!codes(report).includes('ASSET_MSIX_TILE'));
  l.inventory.product_type = 'app'; l.asset.role = 'local-extension'; l.save(); report = checkStoreAssets(f.root);
  contains(report, 'ASSET_ROLE_REVIEW'); assert.ok(!codes(report).includes('ASSET_MSIX_TILE'));
});
test('incorrect actual MSIX dimensions and false declared dimensions are located', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f, { width: 256, height: 256 });
  contains(checkStoreAssets(f.root), 'ASSET_MSIX_TILE'); l.asset.width = 300; l.asset.height = 300; l.save();
  const report = checkStoreAssets(f.root); contains(report, 'ASSET_DIMENSIONS'); contains(report, 'ASSET_MSIX_TILE');
});
test('PNG extension alone cannot disguise non-PNG bytes or wrong declared format', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f); write(l.image, 'not an image');
  contains(checkStoreAssets(f.root), 'ASSET_PNG_HEADER'); l.asset.format = 'jpeg'; l.save();
  contains(checkStoreAssets(f.root), 'ASSET_FORMAT');
});
test('MSIX Logo file ceiling is checked without reading a large image into memory', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f); fs.truncateSync(l.image, 50_000_001);
  contains(checkStoreAssets(f.root), 'ASSET_MSIX_TILE');
});
test('missing Logo source or export is a structural error', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f); fs.unlinkSync(path.join(f.root, l.asset.source)); fs.unlinkSync(l.image);
  const report = checkStoreAssets(f.root); contains(report, 'ASSET_FILE_MISSING'); assert.equal(report.exit_code, 1);
});
test('pending source/export facts are preserved without guessed readiness', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f); fs.unlinkSync(l.image);
  Object.assign(l.asset, { source: null, export: null, width: null, height: null, transparency: 'Unknown', source_provenance: 'Unknown — supplied without origin' }); l.save();
  const before = tree(f.project), report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0, JSON.stringify(report)); contains(report, 'ASSET_PENDING'); assert.deepEqual(tree(f.project), before);
});
test('duplicate language-role assignments across shared/localized inventories are errors', t => {
  const f = fixture(t); logoDraft(f); logo(f); logo(f, { scope: 'en-US' });
  contains(checkStoreAssets(f.root), 'ASSET_DESTINATION_DUPLICATE');
});
test('Logo inventories constrain source/export ownership and state', t => {
  const f = fixture(t); logoDraft(f, ['en-US']); const l = logo(f, { scope: 'en-US' });
  l.asset.source = '../private.svg'; l.save(); contains(checkStoreAssets(f.root), 'PATH_SCOPE');
  l.asset.source = 'microsoft-store/current/en-US/logos/source/mark.svg'; l.save(); contains(checkStoreAssets(f.root), 'ASSET_PATH_SCOPE');
  l.asset.export = 'microsoft-store/release-prep/shared/logos/export/store-logo.png'; l.save(); contains(checkStoreAssets(f.root), 'ASSET_PATH_SCOPE');
});
test('unlisted exports are errors once their owned inventory is explicit', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f); write(path.join(path.dirname(l.image), 'unused-size.png'), png(150, 150));
  contains(checkStoreAssets(f.root), 'ASSET_EXPORT_UNLISTED');
});
test('legacy Logo files require mapping review and are not automatically migrated', t => {
  const f = fixture(t); logoDraft(f); write(path.join(f.root, 'microsoft-store/release-prep/shared/logos/export/old.png'), png(256, 256));
  const before = tree(f.project), report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0); contains(report, 'ASSET_INVENTORY_MISSING'); assert.deepEqual(tree(f.project), before);
});
test('shared sources in localized inventories require explicit shared record coverage', t => {
  const f = fixture(t); logoDraft(f, ['en-US']); const l = logo(f, { scope: 'en-US' }), shared = logo(f);
  l.asset.source = shared.asset.source; l.save(); fs.unlinkSync(shared.file); fs.unlinkSync(shared.image);
  contains(checkStoreAssets(f.root), 'ASSET_RECORD_SCOPE');
  record(f, { refs: ['microsoft-store/release-prep/en-US', 'microsoft-store/release-prep/shared'] });
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('all shared export consumers must appear in the Draft and own complete locale candidates', t => {
  const f = fixture(t); logoDraft(f); logo(f, { locales: ['en-US', 'zh-CN'] });
  contains(checkStoreAssets(f.root), 'ASSET_RECORD_LOCALES');
  fs.cpSync(f.current, path.join(f.root, 'microsoft-store/release-prep/zh-CN'), { recursive: true });
  record(f, { fields: { Locales: 'en-US, zh-CN' }, refs: ['microsoft-store/release-prep/en-US', 'microsoft-store/release-prep/zh-CN', 'microsoft-store/release-prep/shared'] });
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('unchanged shared consumers need no unrelated locale preparation, but byte changes and removals do', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f, { locales: ['en-US', 'zh-CN'] });
  const live = path.join(f.root, 'microsoft-store/current/shared'); fs.cpSync(path.dirname(l.file), live, { recursive: true });
  const baseline = JSON.parse(JSON.stringify(l.inventory));
  for (const asset of baseline.assets) for (const field of ['source', 'export']) asset[field] = asset[field].replace('/release-prep/', '/current/');
  write(path.join(live, 'asset-inventory.json'), JSON.stringify(baseline));
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
  fs.appendFileSync(path.join(f.root, l.asset.source), '\n'); contains(checkStoreAssets(f.root), 'ASSET_RECORD_LOCALES');
  fs.copyFileSync(path.join(live, 'logos/source/mark.svg'), path.join(f.root, l.asset.source));
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
  fs.unlinkSync(l.image); l.inventory.assets = []; l.save(); contains(checkStoreAssets(f.root), 'ASSET_RECORD_LOCALES');
});
test('individual shared source references do not replace the complete shared record scope', t => {
  const f = fixture(t); candidate(f); const l = logo(f, { scope: 'en-US' });
  const shared = 'microsoft-store/release-prep/shared/logos/source/mark.svg'; write(path.join(f.root, shared), '<svg/>');
  l.asset.source = shared; l.save(); record(f, { refs: ['microsoft-store/release-prep/en-US', shared] });
  contains(checkStoreAssets(f.root), 'ASSET_RECORD_SHARED_SCOPE');
});
test('malformed or unsupported inventory does not imply successful platform validation', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f); write(l.file, '{'); contains(checkStoreAssets(f.root), 'INVENTORY_JSON');
  l.inventory.schema_version = 2; l.save(); contains(checkStoreAssets(f.root), 'INVENTORY_SCHEMA');
  l.inventory.schema_version = 1; l.inventory.assets = null; l.save(); contains(checkStoreAssets(f.root), 'INVENTORY_FIELDS');
});
test('explicit empty inventory permits intended removal of the last Logo export', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f); fs.unlinkSync(l.image); l.inventory.assets = []; l.save();
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
});
test('recorded visual approval is evidence to review, never automatic approval', t => {
  const f = fixture(t); logoDraft(f); const l = logo(f); l.asset.review = { visual: 'approved', evidence: 'Fictional reviewer/date with exact export revision' }; l.save();
  const report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0); contains(report, 'ASSET_APPROVAL_EVIDENCE');
});
test('a shared attempt must freeze full inventory/source/export scope', t => {
  const f = fixture(t); init(f); logoDraft(f); logo(f); const commit = freeze(f);
  const paths = ['store-assets/microsoft-store/release-prep/en-US', 'store-assets/microsoft-store/release-prep/shared/asset-inventory.json', 'store-assets/microsoft-store/release-prep/shared/logos/export'];
  submitted(f, commit, { refs: ['microsoft-store/release-prep/en-US', 'microsoft-store/release-prep/shared'], attempts: [{ id: 1, commit, paths }] });
  const report = checkStoreAssets(f.root); contains(report, 'SNAPSHOT_SHARED_SCOPE'); contains(report, 'HISTORICAL_INVENTORY_ASSET');
});
test('promotion rebases only working inventory paths and old attempts resolve their original assets', t => {
  const f = fixture(t); init(f); logoDraft(f); const l = logo(f); const commit = freeze(f), paths = ['store-assets/microsoft-store/release-prep/en-US', 'store-assets/microsoft-store/release-prep/shared'];
  const refs = ['microsoft-store/release-prep/en-US', 'microsoft-store/release-prep/shared'];
  submitted(f, commit, { refs, attempts: [{ id: 1, commit, paths }] });
  assert.equal(checkStoreAssets(f.root).exit_code, 0);
  const original = fs.readFileSync(l.image), liveShared = path.join(f.root, 'microsoft-store/current/shared');
  fs.cpSync(path.dirname(l.file), liveShared, { recursive: true });
  const liveInventory = JSON.parse(fs.readFileSync(l.file, 'utf8'));
  for (const asset of liveInventory.assets) for (const key of ['source', 'export']) asset[key] = asset[key].replace('/release-prep/', '/current/');
  write(path.join(liveShared, 'asset-inventory.json'), JSON.stringify(liveInventory, null, 2));
  fs.cpSync(f.candidate, f.current, { recursive: true }); removeInside(f.project, f.candidate); removeInside(f.project, path.dirname(l.file));
  record(f, { refs, fields: { Status: 'Published' }, attempts: [{ id: 1, commit, paths }],
    events: [event(1, 'draft-created'), event(2, 'submitted', '1'), event(3, 'go-live-confirmed', '1'), event(4, 'promoted', '1')] });
  const before = tree(f.project), report = checkStoreAssets(f.root); assert.equal(report.exit_code, 0, JSON.stringify(report)); assert.deepEqual(tree(f.project), before);
  assert.deepEqual(fs.readFileSync(path.join(liveShared, 'logos/export/store-logo.png')), original);
  const old = git(f, 'show', commit + ':store-assets/microsoft-store/release-prep/shared/asset-inventory.json'); assert.ok(old.includes('/release-prep/'));
});
