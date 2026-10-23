// Fixture preparation/review only. Independent actors are launched separately.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const kitSource = path.join(repo, 'starter-kit');
const matrix = JSON.parse(fs.readFileSync(path.join(repo, 'tests/fixtures/session-handoff/scenarios.json'), 'utf8')).scenarios;
const time = '2026-10-23T17:00:00+08:00', localId = '2026-10-23-logo-refresh';
const slash = input => input.split(path.sep).join('/');
function read(file) { return fs.readFileSync(file, 'utf8'); }
function write(file, data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); }
function inventory(root) {
  const result = {};
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name), name = slash(path.relative(root, file));
      if (entry.isSymbolicLink()) result[name] = 'link:' + fs.readlinkSync(file);
      else if (entry.isDirectory()) { result[name + '/'] = 'directory'; walk(file); }
      else result[name] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    }
  }
  walk(root); return result;
}
function git(cwd, args) {
  const env = { ...process.env, GIT_NO_LAZY_FETCH: '1', GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' };
  for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR']) delete env[key];
  const result = spawnSync('git', ['--no-optional-locks', '--no-lazy-fetch', '-c', 'protocol.allow=never', '-c', 'core.fsmonitor=false', '-c', 'commit.gpgsign=false', '-C', cwd, ...args],
    { env, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr?.toString() || result.error?.message); return result.stdout;
}
function book(template, version) {
  for (const [key, value] of Object.entries({ PRODUCT_NAME: 'Northstar Notes', STORE_PLATFORM: 'microsoft-store', STORE_DISPLAY_NAME: 'Microsoft Store', DEFAULT_LOCALE: 'en-US', CURRENT_APP_VERSION: '1.0.0', RULEBOOK_FILE: 'northstar-notes-store-assets.md', TEMPLATE_VERSION: version })) template = template.replaceAll('{{' + key + '}}', value);
  return template;
}
function event(id, kind, attempt = 'Not applicable', occurred = time, notes = '') {
  return { id, kind, attempt, occurred, notes };
}
function record({ id = localId, status = 'Draft', commit = null, events = [event(1, 'draft-created')], notes = '', open = 'Source/role/visual review pending; no publication evidence.' } = {}) {
  const latest = kind => [...events].reverse().find(item => item.kind === kind);
  const day = value => /^\d{4}-\d{2}-\d{2}/.test(value || '') ? value.slice(0, 10) : '';
  const fields = { 'Submission ID': id, 'Draft created date': day(latest('draft-created')?.occurred), 'Submission date': day(latest('submitted')?.occurred), 'Released application version': '1.0.0', 'Application version': '1.0.0', 'Update type': 'listing-only', 'New package version': 'Not applicable', 'Package evidence': 'Not applicable', 'Store submission ID': 'Pending — not supplied', Locales: 'en-US', Status: status, 'Publication date': '', 'Publication confirmed date': '' };
  const attempt = commit === null ? 'None — not frozen or submitted' : ['### Attempt 1', 'Snapshot commit: ' + commit,
    commit.startsWith('Pending') ? 'Snapshot paths: Pending — historical scope unlocated' : 'Snapshot paths:\n- store-assets/microsoft-store/release-prep/en-US',
    'Approval source: ' + (commit.startsWith('Pending') ? 'Pending — unlocated' : 'facts.md explicit fictional approval of seeded complete attempt 1'),
    'Snapshot verification: ' + (commit.startsWith('Pending') ? 'Pending — unavailable' : 'Verified'), 'Verified at: ' + (commit.startsWith('Pending') ? 'Unknown' : time)].join('\n');
  return ['# Northstar Notes Microsoft Store Submission — ' + id, '', ...Object.entries(fields).map(([key, value]) => key + ': ' + value), '', '## Changes', 'Supplied fictional listing-only Logo task.', '', '## Submitted files', '- microsoft-store/release-prep/en-US', '', '## Submission attempts', attempt, '', '## Events',
    ...events.flatMap(item => ['### Event ' + item.id, 'Event: ' + item.kind, 'Attempt: ' + item.attempt, 'Occurred at: ' + item.occurred, 'Occurred timezone: ' + (item.occurred === 'Unknown' ? 'Unknown' : '+08:00'), 'Observed at: ' + time, 'Recorded at: ' + time, 'Source: facts.md supplied fictional fixture evidence', 'Notes: ' + item.notes, '']),
    '## Open items', open, '', '## Certification result', 'Only supplied fictional observations apply.', '', '## Review notes', notes, ''].join('\n');
}
function png() {
  function chunk(type, bytes) {
    const body = Buffer.concat([Buffer.from(type), bytes]), size = Buffer.alloc(4), crc = Buffer.alloc(4); size.writeUInt32BE(bytes.length);
    let sum = 0xffffffff;
    for (const byte of body) { sum ^= byte; for (let bit = 0; bit < 8; bit++) sum = (sum >>> 1) ^ ((sum & 1) ? 0xedb88320 : 0); }
    crc.writeUInt32BE((sum ^ 0xffffffff) >>> 0); return Buffer.concat([size, body, crc]);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(300); header.writeUInt32BE(300, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.alloc(300 * 901))), chunk('IEND', Buffer.alloc(0))]);
}
function safeRun(input) {
  const run = fs.realpathSync(input), relative = path.relative(fs.realpathSync(os.tmpdir()), run);
  assert.ok(relative && !relative.includes(path.sep) && relative.startsWith('store-assets-independent-'), 'Run must be a known scoped temporary directory');
  const metadata = JSON.parse(read(path.join(run, 'observer.json')));
  assert.equal(metadata.project, path.join(run, 'application')); return { run, metadata };
}
function prepare(id) {
  const scenario = matrix.find(item => item.id === id); assert.ok(scenario, 'Unknown scenario');
  const run = fs.mkdtempSync(path.join(os.tmpdir(), 'store-assets-independent-')), project = path.join(run, 'application'), kit = path.join(project, 'store-assets');
  fs.cpSync(path.join(repo, 'tests/fixtures/update-tasks/application'), project, { recursive: true });
  const adapted = id === 'adapted-upgrade';
  if (adapted) {
    const facts = JSON.parse(read(path.join(repo, 'tests/fixtures/manual-upgrade/facts.json')));
    for (const row of git(repo, ['ls-tree', '-r', '-z', facts.baseline_commit, '--', 'starter-kit']).toString('utf8').split('\0').filter(Boolean)) {
      const entry = row.match(/^\d+ blob ([0-9a-f]+)\tstarter-kit\/(.+)$/); assert.ok(entry); write(path.join(kit, entry[2]), git(repo, ['cat-file', 'blob', entry[1]]));
    }
    const template = read(path.join(kit, 'templates/store-rulebook.md.template'));
    write(path.join(kit, 'northstar-notes-store-assets.md'), book(template, facts.baseline_rulebook_template).replace(/^template_version:.*$/m, 'template_version: ' + facts.local_marker) + '\n' + facts.local_extension);
    write(path.join(kit, 'store-assets-workflow.md'), read(path.join(kit, 'store-assets-workflow.md')) + '\n' + facts.workflow_adaptation + '\n');
    write(path.join(kit, 'local-notes.md'), 'Unclassified user-owned fixture note; preserve these bytes.\n');
    fs.cpSync(kitSource, path.join(run, 'incoming/store-assets'), { recursive: true });
  } else {
    fs.cpSync(kitSource, kit, { recursive: true });
    if (id !== 'initialize-existing') {
      const template = read(path.join(kit, 'templates/store-rulebook.md.template'));
      write(path.join(kit, 'northstar-notes-store-assets.md'), book(template, template.match(/^template_version:\s*(.+)$/m)[1].trim()));
    }
  }
  let facts = read(path.join(repo, 'tests/fixtures/update-tasks/facts.md'));
  let task = scenario.task;
  const current = path.join(kit, 'microsoft-store/current/en-US'), candidate = path.join(kit, 'microsoft-store/release-prep/en-US');
  fs.cpSync(path.join(repo, 'tests/fixtures/update-tasks/published'), current, { recursive: true });
  const seeded = ['orphan-ambiguous', 'orphan-confirmed', 'interface-language', 'submitted-no-confirmation', 'review-fix', 'confirmed-promotion', 'adapted-upgrade'].includes(id);
  if (seeded) {
    fs.cpSync(current, candidate, { recursive: true });
    write(path.join(candidate, 'logos/store-logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><desc>Seeded synthetic candidate, original creation time unknown</desc></svg>\n');
  }
  const activeFile = path.join(kit, 'microsoft-store/submissions', localId + '.md');
  if (['orphan-ambiguous', 'orphan-confirmed'].includes(id)) {
    write(path.join(kit, 'microsoft-store/submissions/2026-10-23-z-prior-withdrawn.md'), '# Northstar Notes Microsoft Store Submission — 2026-10-23-z-prior-withdrawn\nSubmission ID: 2026-10-23-z-prior-withdrawn\nStatus: Withdrawn\nLocales: en-US\nUpdate type: listing-only\nReleased application version: 1.0.0\nApplication version: 1.0.0\nNew package version: Not applicable\nPackage evidence: Not applicable\n\n## Review notes\nInactive fixture record; no candidate ownership supplied.\n');
    facts += '\nCandidate origin/creation/visual/role evidence is unknown; the inactive record supplies no ownership. No active or pending-promotion record exists.\n';
    if (id === 'orphan-confirmed') facts += '\nThe user confirms this is a separate listing-only update, ID ' + localId + ', application 1.0.0, en-US, no new package, no actual submission. New local Draft operations can use actual observed time; original candidate creation time remains Unknown.\n';
  }
  if (['interface-language', 'adapted-upgrade'].includes(id)) write(activeFile, record({ notes: 'Existing seeded Draft; preserve assets and events.', open: 'Original candidate creation time Unknown. Source/role/visual evidence pending.' }));
  if (id === 'interface-language') facts += '\nA fictional operator reports interface language zh-CN on 2026-10-23. Customer locale stays en-US. No translated field label, upload observation or field-acceptance evidence exists. Canonical copy: microsoft-store/release-prep/en-US/listing.md#product-description. Do not duplicate it.\n';
  if (id === 'submitted-no-confirmation') {
    write(activeFile, record({ status: 'Submitted', commit: 'Pending — historical snapshot unlocated', events: [event(1, 'draft-created'), event(2, 'submitted', '1', 'Unknown', 'Explicit fictional actual submission report; occurrence unknown.')], open: 'Historical snapshot/approval are unlocated. No go-live evidence supplied.' }));
    facts += '\nExisting record contains a supplied actual fictional submission report, not publication confirmation. No go-live, platform publication time, approval source or historical asset identity is available. Preserve references and state; no guessed repair or promotion.\n';
  }
  if (id === 'listing-only') {
    write(path.join(project, 'app-assets/mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300"/></svg>\n');
    write(path.join(project, 'app-assets/app-tile.png'), png());
    facts += '\nModern Logo variant: confirmed MSIX Desktop application, listing-only task ID ' + localId + ', no new package. Synthetic QA source app-assets/mark.svg and supplied opaque 300 x 300 PNG app-assets/app-tile.png are authorized for this repository simulation only. No visual approval or actual upload is supplied. Replace the legacy local logos/store-logo.svg in the candidate with an owned source/export inventory for the verified App tile icon field, en-US; preserve unrelated live files and release notes. Record any unverified remote removal/appearance separately.\n';
    task = 'Read the copied workflow and rulebook. Prepare the confirmed modern Logo-only update described in facts.md using the supplied source/export, ID ' + localId + ', en-US, application 1.0.0, no new package. Preserve current and unrelated copy/release notes. Stop before approval, freeze, upload or promotion; record pending visual and external evidence.';
  }
  if (id === 'package-pending') facts += '\nConfirmed separate package-update task ID 2026-10-23-package-refresh, en-US, target application product version 1.1.0. Verified new release capability: notes can be sorted by title. Exact package version, artifact/hash/build and QA evidence are unavailable; preserve explicit pending values. No submission/publication is reported.\n';
  let snapshot = null;
  if (['review-fix', 'confirmed-promotion'].includes(id)) {
    write(path.join(current, 'logos/obsolete.svg'), '<svg><desc>Obsolete fixture input</desc></svg>\n');
    if (id === 'review-fix') write(path.join(candidate, 'logos/obsolete.svg'), read(path.join(current, 'logos/obsolete.svg')));
    git(project, ['init', '--quiet', '--initial-branch=main']); git(project, ['config', 'user.name', 'Independent Fixture']); git(project, ['config', 'user.email', 'fixture@example.invalid']);
    git(project, ['config', 'core.autocrlf', 'false']); git(project, ['config', 'commit.gpgsign', 'false']); git(project, ['config', 'core.hooksPath', path.join(project, 'empty-hooks')]);
    git(project, ['add', '--all']); git(project, ['commit', '--quiet', '-m', 'Explicit fictional complete approved attempt 1']); snapshot = git(project, ['rev-parse', 'HEAD']).toString('utf8').trim();
    const events = [event(1, 'draft-created'), event(2, 'submitted', '1', 'Unknown', 'Actual fictional submission; occurrence time Unknown.')];
    if (id === 'review-fix') {
      events.push(event(3, 'status-observed', '1', 'Unknown', 'Status: Rejected; explicit fictional review requires supplied correction and local obsolete-file removal.'));
      write(activeFile, record({ status: 'Rejected', commit: snapshot, events, open: 'Apply only supplied confirmed review fixes; new approval not supplied.' }));
      write(path.join(project, 'app-assets/corrected-logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><desc>Confirmed fictional correction, awaiting new review</desc></svg>\n');
      facts += '\nAttempt 1 has complete frozen commit ' + snapshot + ' at store-assets/microsoft-store/release-prep/en-US. Its approval and actual submission/rejection reports are explicit fictional fixture evidence. Confirmed review task: reopen SAME record as Draft; replace logos/store-logo.svg with app-assets/corrected-logo.svg and remove logos/obsolete.svg from candidate. Preserve current and attempt 1. No new approval, upload or go-live evidence is supplied: stop before new freeze/submission.\n';
    } else {
      write(activeFile, record({ status: 'Submitted', commit: snapshot, events, open: 'Independent live-page comparison not performed; platform publication time Unknown.' }));
      facts += '\nThe user explicitly confirms the identified submitted attempt 1 is now live. Approved full snapshot: ' + snapshot + ' at store-assets/microsoft-store/release-prep/en-US; it intentionally omits logos/obsolete.svg. Record receipt of this confirmation from the supplied fictional task, verify the actual Git object/content, then promote exactly that snapshot. Actual platform publication time and independent live-page visual comparison remain Unknown. No package or new application version exists. Fixture-local commits are authorized if needed; pushes and real store activity are prohibited.\n';
    }
  }
  if (adapted) {
    const supplied = JSON.parse(read(path.join(repo, 'tests/fixtures/manual-upgrade/facts.json')));
    facts += '\nThe installed generated marker 7.2.0-local is a local adaptation, not proof of the original release/template origin. No original archive/source identity is retained. Preserve the local first-submission extension as a LOCAL project customization outside upstream support; do not execute it. Preserve LOCAL_REVIEW_RULE, local-notes.md, all current/candidate/submission bytes and the active Draft. Incoming kit is at ' + path.join(run, 'incoming/store-assets') + '; its source-default release/commit remain Unknown. Read its upgrading.md. Supplied decision: ' + supplied.conflict_decision + '\n';
    task = 'Perform a manual compare-and-merge upgrade of the installed kit using the separate incoming copy in facts.md. The explicit retention decision is already supplied. Preserve local adaptations and truthful local/generation markers; keep unknown original provenance unknown. Record from/to/path/conflict/check evidence in one provenance record. Do not change any application-state assets/records or execute first-submission work. Read incoming files but write only inside this application. Stop after upgrade review/handoff.';
  }
  facts += '\nAll events/files are fictional, no real store account exists. Use current observed local operation time where needed, never infer event time from record filenames. No external network, real store actions, pushes, dependency installs or interactive user questions are part of this task.\n';
  write(path.join(project, 'facts.md'), facts);
  const taskText = 'Independent QA actor task. Work only in ' + project + '. Read facts.md and the application instructions, then the copied workflow/rulebook. Do not read the Store Assets development repository, parent conversation, sibling runs, observer metadata, or expected-invariant files. Use this application as workdir for every shell call. Do not launch other agents. Do not install anything or contact external services. Do not invoke interactive question tools; report missing prerequisites and stop dependent edits. Write only within this application.' + (adapted ? ' You may also read the incoming kit path explicitly supplied in facts.md, without modifying it.' : '') + '\n\n' + task + '\n\nStop when the selected task is done. Final reply: task/state, paths changed, exact checks and limitations, and next required evidence/action. Do not claim external facts or readiness from a checker result.';
  write(path.join(run, 'actor-task.txt'), taskText);
  write(path.join(run, 'observer.json'), JSON.stringify({ scenario: id, project, kit, snapshot, prepared_at: new Date().toISOString(), before: inventory(project), incoming: adapted ? inventory(path.join(run, 'incoming')) : null }, null, 2));
  console.log(JSON.stringify({ scenario: id, run, project, taskFile: path.join(run, 'actor-task.txt') }));
}
function review(input) {
  const { run, metadata } = safeRun(input), after = inventory(metadata.project), before = metadata.before;
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(name => before[name] !== after[name]);
  const preserve = /^(?:store-assets\/(?:microsoft-store|apple-app-store|google-play)\/(?:current|release-prep|submissions)\/)/;
  const checkerPath = path.join(metadata.kit, 'scripts/check-store-assets.mjs');
  let report;
  if (!fs.readFileSync(checkerPath).equals(fs.readFileSync(path.join(kitSource, 'scripts/check-store-assets.mjs')))) report = { error: 'Actor changed checker implementation; inspect before executing it.', exit_code: null };
  else {
    const checker = spawnSync(process.execPath, [checkerPath, '--root', metadata.kit, '--json'], { encoding: 'utf8', windowsHide: true });
    try { report = JSON.parse(checker.stdout); } catch { report = { error: checker.stderr || checker.error?.message, exit_code: checker.status }; }
  }
  const recordsDir = path.join(metadata.kit, 'microsoft-store/submissions');
  const records = fs.readdirSync(recordsDir).filter(name => name.endsWith('.md')).map(name => {
    const text = read(path.join(recordsDir, name));
    return { name, header: text.split(/^## /m)[0], attempts: [...text.matchAll(/^### Attempt (.+)$/gm)].map(match => match[1]), events: [...text.matchAll(/^Event: (.+)$/gm)].map(match => match[1]), open_items: text.match(/^## Open items\r?\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1], review_notes: text.match(/^## Review notes\r?\n([\s\S]*)/m)?.[1] };
  });
  console.log(JSON.stringify({ scenario: metadata.scenario, changed, state_changes: changed.filter(name => preserve.test(name)), incoming_unchanged: metadata.incoming ? JSON.stringify(inventory(path.join(run, 'incoming'))) === JSON.stringify(metadata.incoming) : null, checker: report, records }, null, 2));
}
const [mode, input] = process.argv.slice(2);
if (mode === 'prepare') prepare(input);
else if (mode === 'review') review(input);
else if (mode === 'cleanup') { const { run } = safeRun(input); fs.rmSync(run, { recursive: true, force: true }); console.log('Removed verified disposable run: ' + run); }
else throw new Error('Usage: node tests/exercises/independent-scenarios.mjs prepare <scenario-id> | review <run> | cleanup <run>');
