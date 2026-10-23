#!/usr/bin/env node
// Standalone Microsoft Store structural checks. No filesystem writes or repairs.
import * as fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const STATUSES = new Set(['Draft', 'Submitted', 'In certification', 'Action required', 'Rejected', 'Withdrawn', 'Published']);
const ACTIVE = new Set(['Draft', 'Submitted', 'In certification', 'Action required']);
const EVENTS = new Set(['draft-created', 'submitted', 'status-observed', 'draft-reopened', 'platform-published', 'go-live-confirmed', 'promoted', 'correction']);
const EXAMPLE_TOKENS = new Set(['LOCALE', 'SUBMISSION_ID', 'APPLICATION_VERSION', 'PUBLICATION_DATE', 'STATUS']);
const HEADER = ['Submission ID', 'Draft created date', 'Submission date', 'Released application version', 'Application version', 'Update type', 'New package version', 'Package evidence', 'Store submission ID', 'Locales', 'Status', 'Publication date', 'Publication confirmed date'];
const SECTIONS = ['Changes', 'Submitted files', 'Submission attempts', 'Events', 'Open items', 'Certification result', 'Review notes'];
const LOGO_ROLES = {
  'msix-app-tile': { route: 'msix', destination: 'Store listings > Store logos > 1:1 App tile icon', ratio: [1, 1] },
  'msi-exe-box': { route: 'msi-exe', destination: 'Store listings > Store logos > 1:1 box art', ratio: [1, 1] },
  'msi-exe-poster': { route: 'msi-exe', destination: 'Store listings > Store logos > 2:3 poster art', ratio: [2, 3] },
};
const pending = value => /^Pending\b/i.test(value || '');
const unknown = value => !value || value === 'Unknown' || pending(value);
const slash = value => value.split(path.sep).join('/');
const within = (base, target) => { const rel = path.relative(base, target); return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel)); };
const day = value => /^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value || '') ? value.slice(0, 10) : '';
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(+date) && date.toISOString().slice(0, 10) === value;
}
function validTime(value) {
  return value === 'Unknown' || validDate(value) ||
    (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
      validDate(value.slice(0, 10)) && !Number.isNaN(Date.parse(value)));
}
function localeName(value) {
  if (!/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value)) return false;
  try { return Intl.getCanonicalLocales(value).length === 1; } catch { return false; }
}
function plainLines(text) {
  let fence = null;
  return text.replace(/^\uFEFF/, '').split(/\r?\n/).map((text, index) => {
    const mark = text.match(/^\s*([~\x60])\1{2,}/);
    if (mark) { fence = fence === mark[1] ? null : (fence || mark[1]); return { text: '', line: index + 1 }; }
    return { text: fence ? '' : text, line: index + 1 };
  });
}
function document(text) {
  const result = { fields: new Map(), sections: new Map(), duplicates: [] };
  let section = null;
  for (const row of plainLines(text)) {
    const heading = row.text.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      section = heading[1];
      if (result.sections.has(section)) result.duplicates.push(row);
      else result.sections.set(section, []);
    } else if (section) result.sections.get(section)?.push(row);
    else {
      const field = row.text.match(/^([^:#][^:]*):\s*(.*)$/);
      if (field) {
        if (result.fields.has(field[1])) result.duplicates.push(row);
        else result.fields.set(field[1], { value: field[2].trim(), line: row.line });
      }
    }
  }
  return result;
}
function blocks(rows, label) {
  const found = [];
  let current, fieldName;
  for (const row of rows || []) {
    const heading = row.text.match(new RegExp('^### ' + label + ' ([1-9][0-9]*)\\s*$'));
    if (heading) { current = { id: Number(heading[1]), line: row.line, fields: new Map(), paths: [], duplicates: [] }; fieldName = ''; found.push(current); }
    else if (current) {
      const field = row.text.match(/^([^:#][^:]*):\s*(.*)$/);
      if (field) {
        fieldName = field[1];
        if (current.fields.has(field[1])) current.duplicates.push(row);
        else current.fields.set(field[1], { value: field[2].trim(), line: row.line });
      } else if (fieldName === 'Snapshot paths' && /^\s*-\s+/.test(row.text)) current.paths.push({ value: row.text.replace(/^\s*-\s+/, '').replace(/^\x60|\x60$/g, '').trim(), line: row.line });
    }
  }
  return found;
}
const value = (obj, key) => obj.fields.get(key)?.value || '';
function references(rows) {
  const result = [];
  for (const row of rows || []) {
    if (!/^\s*-\s+/.test(row.text)) continue;
    const body = row.text.replace(/^\s*-\s+/, '');
    const match = body.match(/^\x60([^\x60]+)\x60/) || body.match(/^\[[^\]]+\]\(([^)]+)\)/) ||
      body.match(/^([^\s]+\/[^\s]*)(?:\s|$)/);
    if (match) result.push({ value: match[1], line: row.line });
  }
  return result;
}
function localLinks(text) {
  const links = [];
  for (const row of plainLines(text)) {
    const visible = row.text.replace(/\x60+[^\x60]*\x60+/g, '');
    for (const match of visible.matchAll(/!?\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+["'][^)]*["'])?\)/g)) {
      const href = match[1] || match[2];
      if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(href)) continue;
      try { links.push({ value: decodeURIComponent(href.split(/[?#]/)[0]), line: row.line }); }
      catch { links.push({ value: null, line: row.line }); }
    }
  }
  return links;
}

export function checkStoreAssets(input, { store = 'microsoft-store', gitExecutable = 'git' } = {}) {
  const findings = [];
  let incomplete = false;
  let root;
  const add = (level, code, file, line, message) => findings.push({ level, code, path: file || '.', line: line || 1, message });
  const fail = (code, file, message) => { incomplete = true; add('error', code, file, 1, message); };
  let gitRoot = null, gitReady = false, gitTried = false, shallow = false, objectFormat = 'sha1', kitPrefix = '';
  function git(args, cwd = root) {
    const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_NO_LAZY_FETCH: '1', GIT_TERMINAL_PROMPT: '0' };
    for (const key of Object.keys(env)) {
      if (/^GIT_TRACE/.test(key) || /^GIT_REDIRECT_/.test(key) || ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR'].includes(key)) delete env[key];
    }
    return spawnSync(gitExecutable, ['--no-optional-locks', '--no-lazy-fetch', '--literal-pathspecs', '-c', 'core.fsmonitor=false', '-c', 'protocol.allow=never', ...args],
      { cwd, env, encoding: null, windowsHide: true, timeout: 15000, maxBuffer: 64 * 1024 * 1024 });
  }
  function output(result) { return result.stdout?.toString('utf8').trim() || ''; }
  function needGit(file) {
    if (gitTried) return gitReady;
    gitTried = true;
    const probe = git(['--version']);
    if (probe.error || probe.status !== 0) { fail('GIT_UNAVAILABLE', file, 'Git with --no-lazy-fetch support is required for snapshot checks; install/update Git, then rerun.'); return false; }
    const top = git(['rev-parse', '--show-toplevel']);
    if (top.status !== 0 || top.error) { fail('GIT_ROOT_UNAVAILABLE', file, 'The kit is not in an accessible Git worktree. Preserve snapshot references and supply the correct project/history.'); return false; }
    gitRoot = fs.realpathSync(output(top));
    if (!within(gitRoot, root)) { fail('GIT_ROOT_UNAVAILABLE', file, 'The kit is outside the resolved Git root.'); return false; }
    kitPrefix = slash(path.relative(gitRoot, root));
    const fmt = git(['rev-parse', '--show-object-format'], gitRoot);
    const depth = git(['rev-parse', '--is-shallow-repository'], gitRoot);
    if (fmt.error || fmt.status !== 0 || depth.error || depth.status !== 0 || !['sha1', 'sha256'].includes(output(fmt))) { fail('GIT_QUERY_FAILED', file, 'Cannot determine the local object format/history.'); return false; }
    objectFormat = output(fmt); shallow = output(depth) === 'true'; gitReady = true;
    return true;
  }
  function read(file) { return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''); }
  function files(directory) {
    if (!fs.existsSync(directory)) return [];
    if (!safeFile(root, slash(path.relative(root, directory)), slash(path.relative(root, directory)), 1)) return [];
    const result = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const name = path.join(directory, entry.name);
      const stat = fs.lstatSync(name);
      if (stat.isSymbolicLink()) { fail('LINK_UNCHECKED', slash(path.relative(root, name)), 'Symbolic links/junctions are not followed; supply ordinary in-scope files for this check.'); continue; }
      if (stat.isDirectory()) result.push(...files(name));
      else if (stat.isFile() && entry.name !== '.gitkeep') result.push(name);
    }
    return result;
  }
  function safeFile(base, relative, file, line, checkLinks = true) {
    if (!relative || relative.includes('\\') || path.posix.isAbsolute(relative) || /^[A-Za-z]:/.test(relative) ||
      relative.split('/').some(part => part === '..' || part === '.git')) {
      add('error', 'PATH_SCOPE', file, line, 'Use a forward-slash relative path inside the declared root.'); return null;
    }
    const target = path.resolve(base, relative);
    if (!within(base, target)) { add('error', 'PATH_SCOPE', file, line, 'Reference escapes its declared root.'); return null; }
    if (!checkLinks) return target;
    let current = base;
    for (const part of path.relative(base, target).split(path.sep).filter(Boolean)) {
      current = path.join(current, part);
      if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) { fail('LINK_UNCHECKED', file, 'A reference passes through a symbolic link/junction; it was not followed.'); return null; }
    }
    return target;
  }
  function tokens(text, file, rulebook = false) {
    let section = '', fence = false;
    text.split(/\r?\n/).forEach((row, index) => {
      if (/^\s*[\x60~]{3}/.test(row)) fence = !fence;
      if (!fence && /^## /.test(row)) section = row.slice(3);
      for (const token of row.matchAll(/\{\{([A-Z][A-Z0-9_]*)\}\}/g)) {
        const namingExample = /^5\. Naming rules/.test(section) && /^\s+- \x60# .+\x60\s*$/.test(row);
        if (rulebook && EXAMPLE_TOKENS.has(token[1]) && (fence || /^1\. Placeholder policy/.test(section) || namingExample)) continue;
        add('error', 'UNRESOLVED_TOKEN', file, index + 1, 'Resolve ' + token[0] + ' in generated content; templates are the only project-token sources.');
      }
    });
  }
  function missingFields(obj, names, file, severity = 'error') {
    for (const key of names) if (!obj.fields.has(key)) add(severity, 'MISSING_FIELD', file, obj.line || 1, 'Add the required field: ' + key + '; preserve unknown facts explicitly.');
    for (const row of obj.duplicates || []) add('error', 'DUPLICATE_FIELD', file, row.line, 'A repeated heading/field makes this record ambiguous.');
  }
  function timeHistory(record) {
    const { file, modern, events } = record;
    let state = null, confirmed = new Set(), corrected = events.some(event => value(event, 'Event') === 'correction');
    let lastId = 0;
    for (const event of events) {
      if (event.id <= lastId) add('error', 'EVENT_ORDER', file, event.line, 'Event IDs must be unique and increasing.');
      lastId = event.id;
      missingFields(event, ['Event', 'Attempt', 'Occurred at', 'Occurred timezone', 'Observed at', 'Recorded at', 'Source', 'Notes'], file);
      const kind = value(event, 'Event'), attempt = value(event, 'Attempt');
      if (!EVENTS.has(kind)) add('error', 'EVENT_TYPE', file, event.line, 'Use a documented event type.');
      if (!value(event, 'Source') || pending(value(event, 'Source'))) add('review', 'EVENT_SOURCE', file, event.line, 'Supply the event source; a source string still requires human verification.');
      for (const key of ['Occurred at', 'Observed at', 'Recorded at']) {
        const time = value(event, key);
        if (!time || !validTime(time)) add('error', 'EVENT_TIME', file, event.fields.get(key)?.line || event.line, 'Use Unknown, a real date, or a timestamp with an explicit UTC offset for ' + key + '.');
        else if (key === 'Recorded at' && time === 'Unknown') add('review', 'EVENT_TIME_UNKNOWN', file, event.line, 'The recording time is unknown; retain the historical limitation instead of manufacturing it.');
      }
      if (/^\d+$/.test(attempt) && !record.attempts.some(item => item.id === Number(attempt))) add('error', 'EVENT_ATTEMPT', file, event.line, 'Event references a missing attempt.');
      if (attempt === 'Unknown') add('review', 'EVENT_ATTEMPT_UNKNOWN', file, event.line, 'Resolve the attempt association from evidence; do not guess it.');
      else if (attempt !== 'Not applicable' && !/^[1-9]\d*$/.test(attempt)) add('error', 'EVENT_ATTEMPT', file, event.line, 'Use an attempt number, Unknown, or Not applicable.');
      if (kind === 'draft-created') state = 'Draft';
      if (kind === 'draft-reopened') {
        if (state && !['Rejected', 'Action required'].includes(state)) add('error', 'ILLEGAL_LOCAL_TRANSITION', file, event.line, 'A local return to Draft requires confirmed review fixes from Rejected/Action required.');
        state = 'Draft';
      }
      if (kind === 'submitted') {
        if (state && state !== 'Draft') add('review', 'STATE_HISTORY_GAP', file, event.line, 'Submission history omits a return to Draft or conflicts with earlier events; reconcile the evidence.');
        state = 'Submitted';
      }
      if (kind === 'status-observed') {
        const observed = value(event, 'Notes').match(/(?:^|[;\n]\s*)Status:\s*([^;.\r\n]+)/)?.[1]?.trim();
        if (!observed || !STATUSES.has(observed)) add('review', 'STATUS_EVENT_FORMAT', file, event.line, 'Use Notes: Status: <documented status>; source/limitations for machine-readable state observations.');
        else state = observed;
      }
      if (kind === 'go-live-confirmed') { state = 'Published'; confirmed.add(attempt); }
      if (kind === 'promoted' && (!/^[1-9]\d*$/.test(attempt) || !confirmed.has(attempt))) add('error', 'PROMOTION_CONFIRMATION', file, event.line, 'Promotion needs an earlier explicit go-live confirmation for the same identified attempt.');
    }
    if (corrected) add('review', 'CORRECTION_REVIEW', file, 1, 'Review correction events and superseded values manually; automatic summary comparison was skipped.');
    else {
      if (state && state !== record.status) add('error', 'STATE_SUMMARY', file, record.fields.get('Status')?.line, 'Status disagrees with the last structured event; reconcile without inventing missing events.');
      for (const [field, kind, timeKey] of [
        ['Draft created date', 'draft-created', 'Occurred at'], ['Submission date', 'submitted', 'Occurred at'],
        ['Publication date', 'platform-published', 'Occurred at'], ['Publication confirmed date', 'go-live-confirmed', 'Observed at'],
      ]) {
        const event = [...events].reverse().find(item => value(item, 'Event') === kind);
        const expected = event ? day(value(event, timeKey)) : '';
        const actual = value(record, field);
        if (modern && actual !== expected) add('error', 'DATE_SOURCE', file, record.fields.get(field)?.line, field + ' must reflect its corresponding known event date, not a filename or observation of another event.');
      }
    }
    if (modern && record.status === 'Published' && !events.some(event => value(event, 'Event') === 'go-live-confirmed')) add('review', 'PUBLICATION_EVIDENCE', file, 1, 'Published has no explicit go-live event. Preserve the reported status and add evidence or a legacy interpretation note.');
    const confirmationIndex = events.findLastIndex(event => value(event, 'Event') === 'go-live-confirmed');
    record.promotionPending = record.status === 'Published' && confirmationIndex >= 0 &&
      !events.slice(confirmationIndex + 1).some(event => value(event, 'Event') === 'promoted' && value(event, 'Attempt') === value(events[confirmationIndex], 'Attempt'));
  }
  function snapshots(record) {
    let lastId = 0;
    for (const attempt of record.attempts) {
      if (attempt.id <= lastId) add('error', 'ATTEMPT_ORDER', record.file, attempt.line, 'Attempt IDs must be unique and increasing.');
      lastId = attempt.id;
      missingFields(attempt, ['Snapshot commit', 'Snapshot paths', 'Approval source', 'Snapshot verification', 'Verified at'], record.file);
      const commit = value(attempt, 'Snapshot commit');
      attempt.entries = new Map();
      if (unknown(commit)) { add('review', 'SNAPSHOT_PENDING', record.file, attempt.line, 'Snapshot identity is pending. Continue independent Draft work; do not claim snapshot readiness.'); continue; }
      if (!/^[0-9a-f]+$/i.test(commit)) { add('error', 'SNAPSHOT_ID', record.file, attempt.line, 'Record the full resolved commit object ID, not HEAD/a branch/a tag.'); continue; }
      if (!needGit(record.file)) continue;
      if (commit.length !== (objectFormat === 'sha256' ? 64 : 40)) { add('error', 'SNAPSHOT_ID', record.file, attempt.line, 'Use the full ID for this repository object format, not an abbreviated hash.'); continue; }
      const resolved = git(['rev-parse', '--verify', '--end-of-options', commit + '^{commit}'], gitRoot);
      if (resolved.error) { fail('GIT_QUERY_FAILED', record.file, 'Git could not complete snapshot lookup (timeout/output/runtime).'); continue; }
      if (resolved.status !== 0) {
        const partial = git(['config', '--get-regexp', '^remote\\..*\\.promisor$'], gitRoot);
        if (shallow || output(partial)) fail('SNAPSHOT_NOT_LOCAL', record.file, 'The recorded commit is unavailable in this shallow/partial checkout. Supply history; no fetch or HEAD substitution was attempted.');
        else add('error', 'SNAPSHOT_MISSING', record.file, attempt.line, 'Recorded commit cannot be resolved in available local history. Preserve its reference and investigate missing/incorrect history.');
        continue;
      }
      if (output(resolved) !== commit.toLowerCase()) { add('error', 'SNAPSHOT_ID', record.file, attempt.line, 'Use the complete resolved object ID rather than an abbreviation.'); continue; }
      if (!attempt.paths.length) add(pending(value(attempt, 'Snapshot paths')) ? 'review' : 'error', 'SNAPSHOT_PATHS', record.file, attempt.line, 'List complete repository-relative snapshot scopes, or state the known historical path gap explicitly.');
      for (const item of attempt.paths) {
        const target = safeFile(gitRoot, item.value, record.file, item.line, false);
        if (!target) continue;
        const prefix = [kitPrefix, store].filter(Boolean).join('/') + '/';
        if (!item.value.startsWith(prefix)) { add('review', 'SNAPSHOT_SCOPE', record.file, item.line, 'This snapshot path is outside the selected store; its contents were not inspected. Review the local adaptation.'); continue; }
        const exists = git(['cat-file', '-t', commit + ':' + item.value], gitRoot);
        if (exists.error) { fail('GIT_QUERY_FAILED', record.file, 'Git could not complete historical path lookup.'); continue; }
        if (exists.status !== 0) { add('error', 'SNAPSHOT_PATH_MISSING', record.file, item.line, 'Path does not exist at the recorded commit; a current working file is not a replacement.'); continue; }
        const tree = git(['ls-tree', '-r', '-l', '-z', commit, '--', item.value], gitRoot);
        if (tree.error || tree.status !== 0) { fail('GIT_QUERY_FAILED', record.file, 'Cannot enumerate the recorded asset scope.'); continue; }
        for (const row of tree.stdout.toString('utf8').split('\0').filter(Boolean)) {
          const match = row.match(/^(\d+) (blob|commit) ([0-9a-f]+)\s+(\d+|-)\t([\s\S]+)$/);
          if (!match) { fail('GIT_TREE_FORMAT', record.file, 'Historical tree output could not be interpreted.'); continue; }
          const entry = { mode: match[1], type: match[2], oid: match[3], size: Number(match[4]), name: match[5] };
          attempt.entries.set(entry.name, entry);
          if (entry.mode === '120000' || entry.type === 'commit') add('review', 'EXTERNAL_ASSET', record.file, attempt.line, 'Snapshot includes a link/submodule; ordinary asset content needs separate verification.');
          else if (entry.size <= 1024) {
            const blob = git(['cat-file', 'blob', entry.oid], gitRoot);
            if (blob.error || blob.status !== 0) fail('SNAPSHOT_CONTENT_UNAVAILABLE', record.file, 'A referenced asset object is unavailable locally; no network retrieval was attempted.');
            else if (blob.stdout.toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1')) add('review', 'EXTERNAL_ASSET', record.file, attempt.line, 'A Git LFS pointer is not the upload asset; verify its actual content separately.');
          }
        }
      }
      if (value(attempt, 'Snapshot verification') !== 'Verified') add('review', 'SNAPSHOT_VERIFICATION', record.file, attempt.line, 'The recorded snapshot verification is pending or unrecognized; review its approval/content evidence.');
      if (!validTime(value(attempt, 'Verified at')) || (value(attempt, 'Snapshot verification') === 'Verified' && value(attempt, 'Verified at') === 'Unknown')) add('review', 'SNAPSHOT_VERIFIED_TIME', record.file, attempt.line, 'Record the known verification time or explicitly retain an unknown/pending verification gap.');
      if (unknown(value(attempt, 'Approval source'))) add('review', 'SNAPSHOT_APPROVAL', record.file, attempt.line, 'Approval evidence is incomplete. A stored commit does not prove approval or actual submission.');
      if (attempt.entries.size) for (const locale of record.locales) {
        const scopes = ['release-prep', 'current'].map(state => [kitPrefix, store, state, locale].filter(Boolean).join('/'));
        if (!attempt.paths.some(item => scopes.some(scope => item.value === scope || scope.startsWith(item.value.replace(/\/$/, '') + '/')))) add('error', 'SNAPSHOT_LOCALE_SCOPE', record.file, attempt.line, 'Snapshot paths must cover the complete affected locale tree: ' + locale + ', not only one changed file.');
      }
      if (attempt.entries.size && record.refs.some(ref => ref.value === store + '/release-prep/shared' || ref.value.startsWith(store + '/release-prep/shared/'))) {
        const scopes = ['release-prep', 'current'].map(state => [kitPrefix, store, state, 'shared'].filter(Boolean).join('/'));
        if (!attempt.paths.some(item => scopes.some(scope => item.value === scope || scope.startsWith(item.value.replace(/\/$/, '') + '/')))) add('error', 'SNAPSHOT_SHARED_SCOPE', record.file, attempt.line, 'Snapshot paths must cover the complete shared candidate tree, not only its changed export.');
      }
      for (const entry of attempt.entries.values()) if (entry.type === 'blob' && entry.mode !== '120000' && entry.name.endsWith('/asset-inventory.json')) {
        if (entry.size > 512 * 1024) { add('review', 'HISTORICAL_INVENTORY_SIZE', record.file, attempt.line, 'Large historical inventory requires manual review.'); continue; }
        const blob = git(['cat-file', 'blob', entry.oid], gitRoot);
        if (blob.error || blob.status !== 0) { fail('SNAPSHOT_CONTENT_UNAVAILABLE', record.file, 'Historical inventory is unavailable locally.'); continue; }
        let inventory;
        try { inventory = JSON.parse(blob.stdout.toString('utf8').replace(/^\uFEFF/, '')); }
        catch { add('error', 'HISTORICAL_INVENTORY_JSON', record.file, attempt.line, 'Historical inventory is invalid JSON: ' + entry.name); continue; }
        if (inventory?.schema_version !== 1 || !Array.isArray(inventory.assets)) { add('review', 'HISTORICAL_INVENTORY_SCHEMA', record.file, attempt.line, 'Historical inventory has an unsupported schema; review at its recorded commit.'); continue; }
        for (const asset of inventory.assets) for (const field of ['source', 'export']) {
          const ref = asset?.[field];
          if (typeof ref !== 'string') { add('review', 'HISTORICAL_ASSET_PENDING', record.file, attempt.line, 'Historical inventory has a pending asset path; preserve this gap.'); continue; }
          const relative = [kitPrefix, ref].filter(Boolean).join('/');
          if (!safeFile(gitRoot, relative, record.file, attempt.line, false)) continue;
          if (!attempt.entries.has(relative)) add('error', 'HISTORICAL_INVENTORY_ASSET', record.file, attempt.line, 'Inventory asset is absent from the complete stored attempt: ' + relative + '. Current files are not historical evidence.');
        }
      }
      for (const entry of attempt.entries.values()) if (entry.type === 'blob' && entry.mode !== '120000' && entry.name.endsWith('.md')) {
        if (entry.size > 512 * 1024) { add('review', 'HISTORICAL_MARKDOWN_SIZE', record.file, attempt.line, 'Large historical Markdown asset links require manual review.'); continue; }
        const blob = git(['cat-file', 'blob', entry.oid], gitRoot);
        if (blob.error || blob.status !== 0) { fail('SNAPSHOT_CONTENT_UNAVAILABLE', record.file, 'Historical Markdown content is not available locally.'); continue; }
        const text = blob.stdout.toString('utf8');
        tokens(text, entry.name + ' at ' + commit);
        for (const link of localLinks(text)) {
          if (link.value === null) { add('review', 'ASSET_LINK_FORMAT', record.file, attempt.line, 'A historical local link has invalid URL escaping.'); continue; }
          const historicalPath = path.posix.normalize(path.posix.join(path.posix.dirname(entry.name), link.value));
          if (!attempt.entries.has(historicalPath)) add('review', 'HISTORICAL_ASSET_LINK', record.file, attempt.line, 'Historical local link is outside or absent from this stored scope: ' + historicalPath + '. Review its intended role; current files are not proof of historical content.');
        }
      }
    }
  }
  function assetLogical(name) {
    const prefix = [kitPrefix, store].filter(Boolean).join('/') + '/';
    if (name.startsWith(prefix)) name = name.slice(prefix.length);
    else if (name.startsWith(store + '/')) name = name.slice(store.length + 1);
    return name.replace(/^(?:current|release-prep)\//, '');
  }
  function checkReferences(record) {
    const historical = ['Published', 'Withdrawn', 'Rejected'].includes(record.status) && !record.promotionPending;
    const entries = record.attempts.flatMap(attempt => [...attempt.entries?.values() || []]);
    for (const ref of record.refs) {
      if (/^[a-z]+:\/\//i.test(ref.value)) continue;
      const target = safeFile(root, ref.value, record.file, ref.line, !historical);
      if (!target) continue;
      if (historical) {
        if (!entries.length) { add('review', 'HISTORICAL_REFERENCE_UNCHECKED', record.file, ref.line, 'Historical file reference needs an available attempt snapshot; current files do not establish past content.'); continue; }
        const logical = assetLogical(ref.value).replace(/\/$/, '');
        if (!entries.some(entry => assetLogical(entry.name) === logical || assetLogical(entry.name).startsWith(logical + '/'))) add('error', 'HISTORICAL_FILE_MISSING', record.file, ref.line, 'File is absent from every available recorded attempt; check the historical reference.');
      } else if (!fs.existsSync(target)) add('error', 'FILE_MISSING', record.file, ref.line, 'Referenced candidate file/directory does not exist. Restore it or explicitly correct the record scope.');
    }
    if (!record.refs.length && record.sections.get('Submitted files')?.some(row => row.text.trim())) add('review', 'FILE_LIST_FORMAT', record.file, 1, 'No checkable file references found. Use bullet paths in backticks or Markdown links; prose is not interpreted as ownership.');
  }
  function compareCandidate(record, candidateFiles) {
    const event = [...record.events].reverse().find(event => ['submitted', 'go-live-confirmed'].includes(value(event, 'Event')));
    const frozen = ['Submitted', 'In certification', 'Action required'].includes(record.status) || record.promotionPending;
    if (frozen && (!event || !/^[1-9]\d*$/.test(value(event, 'Attempt')))) {
      add('review', 'CANDIDATE_ATTEMPT_UNKNOWN', record.file, 1, 'The latest external event has no established attempt binding. Do not compare/promote an older convenient snapshot; resolve the association from evidence.'); return;
    }
    const attempt = record.status === 'Draft' ? record.attempts.at(-1) : event ? record.attempts.find(attempt => attempt.id === Number(value(event, 'Attempt'))) : record.attempts.at(-1);
    if (!attempt?.entries?.size || !gitReady) return;
    const scopePrefix = [kitPrefix, store, 'release-prep'].filter(Boolean).join('/') + '/';
    const currentPrefix = [kitPrefix, store, 'current'].filter(Boolean).join('/') + '/';
    const stored = new Map([...attempt.entries].filter(([name]) => name.startsWith(currentPrefix)).map(([name, entry]) => [scopePrefix + name.slice(currentPrefix.length), entry]));
    for (const [name, entry] of attempt.entries) if (name.startsWith(scopePrefix)) stored.set(name, entry);
    if (!stored.size) return;
    const working = new Map(candidateFiles.map(file => [slash(path.relative(gitRoot, file)), file]));
    const level = frozen ? 'error' : 'review';
    for (const [name, entry] of stored) {
      if (!working.has(name)) { add(level, 'CANDIDATE_SNAPSHOT_DIFF', record.file, attempt.line, 'Current candidate omits a frozen file: ' + name + '. Draft edits/removals require a new approved snapshot before handoff.'); continue; }
      const bytes = fs.readFileSync(working.get(name));
      const hash = buffer => crypto.createHash(objectFormat).update('blob ' + buffer.length + '\0').update(buffer).digest('hex');
      if (hash(bytes) === entry.oid) continue;
      const attr = git(['check-attr', 'text', 'eol', 'filter', 'working-tree-encoding', '--', name], gitRoot);
      const attrs = output(attr);
      if (attr.error || attr.status !== 0) { fail('GIT_QUERY_FAILED', record.file, 'Cannot inspect text/filter attributes without executing filters.'); continue; }
      if (/:(?: filter| working-tree-encoding): (?!unspecified|unset)/.test(attrs)) { add('review', 'FILTERED_CONTENT', record.file, attempt.line, 'A Git content filter/encoding requires manual comparison; no filter was executed.'); continue; }
      const lf = Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
      if (!bytes.includes(0) && /: (?:text: (?:set|auto)|eol: (?:lf|crlf))/.test(attrs) && hash(lf) === entry.oid) continue;
      add(level, 'CANDIDATE_SNAPSHOT_DIFF', record.file, attempt.line, 'Candidate content differs from the frozen asset: ' + name + '. Do not promote unapproved edits.');
    }
    for (const name of working.keys()) if (!stored.has(name)) add(level, 'CANDIDATE_NOT_FROZEN', record.file, attempt.line, 'Candidate contains a file outside this frozen tree: ' + name + '. Check intended untracked/ignored additions.');
  }

  function checkInventories(assetFiles) {
    const inventories = [], assigned = new Set();
    const unresolved = input => typeof input === 'string' && /^(?:Unknown|Pending)\b/.test(input);
    const inventoryFiles = assetFiles.filter(file => path.basename(file) === 'asset-inventory.json');
    for (const file of inventoryFiles) {
      const name = slash(path.relative(root, file)), parts = name.split('/'), state = parts[1], scope = parts[2];
      const issue = (level, code, message) => add(level, code, name, 1, message);
      if (parts.length !== 4 || (scope !== 'shared' && !localeName(scope))) { issue('error', 'INVENTORY_SCOPE', 'Place inventory at <state>/<locale-or-shared>/asset-inventory.json.'); continue; }
      const text = read(file); tokens(text, name);
      let inventory;
      try { inventory = JSON.parse(text); }
      catch { issue('error', 'INVENTORY_JSON', 'Restore valid JSON; the inventory was not interpreted.'); continue; }
      if (!inventory || inventory.schema_version !== 1) { issue('review', 'INVENTORY_SCHEMA', 'Unsupported inventory schema; review manually rather than assuming role checks passed.'); continue; }
      if (!Array.isArray(inventory.assets)) { issue('error', 'INVENTORY_FIELDS', 'assets must be an array; an explicit empty array can represent removal of the last export.'); continue; }
      for (const key of ['template_version', 'package_type', 'product_type', 'device_family']) if (typeof inventory[key] !== 'string' || !inventory[key].trim()) issue('error', 'INVENTORY_FIELDS', 'Supply inventory field ' + key + '.');
      const supported = ['msix', 'msi-exe'].includes(inventory.package_type) && inventory.product_type === 'app' && inventory.device_family === 'Desktop';
      if (!supported) issue('review', 'ASSET_PROFILE_REVIEW', 'Only verified MSIX/MSI-EXE Desktop application roles receive automatic platform checks; confirm unknown/game/other-device requirements.');
      const result = { name, state, scope, profile: [inventory.package_type, inventory.product_type, inventory.device_family], assets: [], dependencies: new Set() }, ids = new Set(), exports = new Set();
      inventories.push(result);
      for (const asset of inventory.assets) {
        if (!asset || typeof asset !== 'object' || Array.isArray(asset)) { issue('error', 'INVENTORY_FIELDS', 'Every asset must be an object.'); continue; }
        const label = typeof asset.id === 'string' ? asset.id : '(missing id)';
        const finding = (level, code, message) => issue(level, code, label + ': ' + message);
        if (typeof asset.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset.id) || ids.has(asset.id)) finding('error', 'ASSET_ID', 'Use a unique lowercase kebab-case id within the inventory.');
        ids.add(asset.id);
        for (const key of ['role', 'destination', 'source_provenance', 'format', 'transparency', 'generation_method', 'requirements_source', 'requirements_reviewed']) {
          if (typeof asset[key] !== 'string' || !asset[key].trim()) finding('error', 'INVENTORY_FIELDS', 'Supply ' + key + ', preserving unknown evidence explicitly.');
          else if (unresolved(asset[key])) finding('review', 'ASSET_PENDING', key + ' is unresolved; independent Draft preparation may continue.');
        }
        if (!Array.isArray(asset.locales) || !asset.locales.length || asset.locales.some(locale => typeof locale !== 'string' || !localeName(locale)) || new Set(asset.locales).size !== asset.locales.length) finding('error', 'ASSET_LOCALES', 'Supply distinct valid consumer locales.');
        const locales = Array.isArray(asset.locales) ? asset.locales.filter(locale => typeof locale === 'string' && localeName(locale)) : [];
        if (scope !== 'shared' && locales.some(locale => locale !== scope)) finding('error', 'ASSET_LOCALES', 'Localized exports can target only their owning locale; use shared for deliberate reuse.');
        result.assets.push({ ...asset, locales });
        for (const locale of locales) {
          const key = state + '/' + locale + '/' + asset.role;
          if (assigned.has(key)) finding('error', 'ASSET_DESTINATION_DUPLICATE', 'More than one export assigns this role to ' + locale + ' in ' + state + '.');
          assigned.add(key);
        }
        const role = LOGO_ROLES[asset.role];
        if (!role) finding('review', 'ASSET_ROLE_REVIEW', 'This role has no automatic platform rules; verify its destination/requirements explicitly.');
        else if (supported) {
          if (role.route !== inventory.package_type) finding('error', 'ASSET_ROLE_PROFILE', 'Role does not match the declared package route.');
          else if (asset.destination !== role.destination) finding('error', 'ASSET_DESTINATION', 'Use the verified destination: ' + role.destination);
          if (role.route === 'msi-exe') finding('review', 'ASSET_REQUIREMENTS_REVIEW', 'MSI/EXE numeric dimensions, encoding, file limit and alpha policy require current upload-field evidence; no MSIX dimensions are inferred.');
        }
        for (const key of ['width', 'height']) {
          if (asset[key] === null) finding('review', 'ASSET_PENDING', key + ' is not yet measured.');
          else if (!Number.isInteger(asset[key]) || asset[key] <= 0) finding('error', 'ASSET_DIMENSIONS', key + ' must be a positive integer or null.');
        }
        if (!['present', 'absent', 'Unknown'].includes(asset.transparency)) finding('error', 'ASSET_TRANSPARENCY', 'Use present, absent, or Unknown; pixel alpha/background appearance requires review.');
        if (asset.requirements_reviewed !== 'Unknown' && !validDate(asset.requirements_reviewed)) finding('error', 'ASSET_REQUIREMENTS_DATE', 'Use a real review date or Unknown.');
        if (typeof asset.requirements_source === 'string' && !unresolved(asset.requirements_source) && !/^https:\/\//.test(asset.requirements_source)) finding('error', 'ASSET_REQUIREMENTS_SOURCE', 'Use an authoritative HTTPS URL, or explicit Unknown/Pending information.');
        if (!asset.review || !['pending', 'approved', 'changes-required'].includes(asset.review.visual) || typeof asset.review.evidence !== 'string' || !asset.review.evidence.trim()) finding('error', 'ASSET_REVIEW_FORMAT', 'Supply review.visual and review.evidence.');
        else {
          if (asset.review.visual !== 'approved' || unknown(asset.review.evidence)) finding('review', 'ASSET_VISUAL_REVIEW', 'Visual review is pending/needs changes or lacks evidence; technical checks do not approve artwork.');
          else finding('review', 'ASSET_APPROVAL_EVIDENCE', 'Recorded visual approval still needs human evidence review; this checker cannot authenticate it.');
        }
        const paths = {};
        for (const field of ['source', 'export']) {
          const ref = asset[field];
          if (ref === null) { finding('review', 'ASSET_PENDING', field + ' file is pending.'); continue; }
          if (typeof ref !== 'string') { finding('error', 'INVENTORY_FIELDS', field + ' must be a kit-relative path or null.'); continue; }
          const target = safeFile(root, ref, name, 1);
          if (!target) continue;
          const scopes = field === 'source' ? [...new Set([scope, 'shared'])] : [scope];
          if (!scopes.some(owner => ref.startsWith(store + '/' + state + '/' + owner + '/logos/' + (field === 'source' ? 'source' : 'export') + '/'))) { finding('error', 'ASSET_PATH_SCOPE', field + ' must stay in its owning state/scope and logos/source or logos/export directory.'); continue; }
          result.dependencies.add(ref);
          if (field === 'export') {
            if (exports.has(ref)) finding('error', 'ASSET_EXPORT_DUPLICATE', 'An export appears more than once; list its consumers in one row.');
            exports.add(ref);
          }
          if (!fs.existsSync(target) || !fs.statSync(target).isFile()) finding('error', 'ASSET_FILE_MISSING', field + ' file is missing: ' + ref);
          else paths[field] = target;
        }
        if (paths.export) {
          const stat = fs.statSync(paths.export), header = Buffer.alloc(33), fd = fs.openSync(paths.export, 'r');
          let length;
          try { length = fs.readSync(fd, header, 0, header.length, 0); } finally { fs.closeSync(fd); }
          const png = length === 33 && header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && header.readUInt32BE(8) === 13 && header.toString('ascii', 12, 16) === 'IHDR';
          if (asset.format !== 'Unknown' && asset.format !== path.extname(paths.export).slice(1).toLowerCase()) finding('error', 'ASSET_FORMAT', 'Declared format differs from export extension.');
          if (asset.format === 'png' && !png) finding('error', 'ASSET_PNG_HEADER', 'Export has no readable PNG IHDR; restore the actual image. Full image decoding remains a separate review.');
          if (png && ((asset.width !== null && asset.width !== header.readUInt32BE(16)) || (asset.height !== null && asset.height !== header.readUInt32BE(20)))) finding('error', 'ASSET_DIMENSIONS', 'Declared dimensions disagree with the PNG header.');
          if (supported && role?.route === inventory.package_type && asset.role === 'msix-app-tile' && (!png || asset.format !== 'png' || header.readUInt32BE(16) !== 300 || header.readUInt32BE(20) !== 300 || stat.size > 50_000_000)) finding('error', 'ASSET_MSIX_TILE', 'MSIX app tile must be a 300 x 300 PNG, at most 50,000,000 bytes under the documented conservative ceiling.');
        }
        if (supported && role?.route === inventory.package_type && Number.isInteger(asset.width) && Number.isInteger(asset.height) && asset.width * role.ratio[1] !== asset.height * role.ratio[0]) finding('error', 'ASSET_ASPECT_RATIO', 'Declared dimensions do not match the named upload role aspect ratio.');
      }
      for (const exportFile of assetFiles.filter(file => slash(path.relative(root, file)).startsWith(store + '/' + state + '/' + scope + '/logos/export/'))) if (!exports.has(slash(path.relative(root, exportFile)))) issue('error', 'ASSET_EXPORT_UNLISTED', 'Export has no inventory consumer: ' + slash(path.relative(root, exportFile)));
    }
    for (const file of assetFiles) {
      const name = slash(path.relative(root, file)), parts = name.split('/');
      if (parts.includes('logos') && !inventoryFiles.some(inventory => slash(path.relative(root, inventory)) === parts.slice(0, 3).join('/') + '/asset-inventory.json')) add('review', 'ASSET_INVENTORY_MISSING', name, 1, 'Legacy/unmapped Logo file: inspect its source, role and destination before adding an inventory; no migration was performed.');
    }
    function digest(file) {
      const hash = crypto.createHash('sha256'), buffer = Buffer.alloc(65536), fd = fs.openSync(file, 'r');
      try { let count; while ((count = fs.readSync(fd, buffer, 0, buffer.length, null))) hash.update(buffer.subarray(0, count)); }
      finally { fs.closeSync(fd); }
      return hash.digest('hex');
    }
    // A complete shared candidate retains exports for unaffected languages too.
    // Only changed/removed rows and files extend this submission's locale scope.
    for (const inventory of inventories.filter(item => item.state === 'release-prep' && item.scope === 'shared')) {
      const live = inventories.find(item => item.state === 'current' && item.scope === 'shared');
      inventory.changedLocales = new Set();
      const normalized = (owner, asset) => JSON.stringify([owner.profile, ...['role', 'destination', 'locales', 'source', 'export', 'width', 'height', 'format', 'transparency'].map(key =>
        typeof asset[key] === 'string' && ['source', 'export'].includes(key) ? asset[key].replace('/current/', '/release-prep/') : asset[key])]);
      const sameFiles = (asset, old) => ['source', 'export'].every(key => {
        if (!inventory.dependencies.has(asset[key]) || !live?.dependencies.has(old[key])) return false;
        const left = path.join(root, asset[key]), right = path.join(root, old[key]);
        return fs.existsSync(left) && fs.existsSync(right) && fs.statSync(left).isFile() && fs.statSync(right).isFile() &&
          fs.statSync(left).size === fs.statSync(right).size && digest(left) === digest(right);
      });
      for (const asset of inventory.assets) {
        const old = live?.assets.find(item => item.id === asset.id);
        if (!old || normalized(inventory, asset) !== normalized(live, old) || !sameFiles(asset, old)) for (const locale of [...asset.locales, ...(old?.locales || [])]) inventory.changedLocales.add(locale);
      }
      for (const old of live?.assets || []) if (!inventory.assets.some(asset => asset.id === old.id)) for (const locale of old.locales) inventory.changedLocales.add(locale);
    }
    return inventories;
  }

  try {
    if (store !== 'microsoft-store') { fail('UNSUPPORTED_STORE', '.', 'Only the microsoft-store adapter is implemented. Reserved adapters are not checked.'); }
    else if (!input || !fs.existsSync(input) || !fs.statSync(input).isDirectory()) fail('INPUT_ROOT', '.', 'Pass --root pointing to the copied store-assets/ directory.');
    else {
      root = fs.realpathSync(input);
      if (!['README.md', 'store-assets-workflow.md', 'templates/store-rulebook.md.template'].every(name => fs.existsSync(path.join(root, name)) && fs.lstatSync(path.join(root, name)).isFile())) fail('INPUT_ROOT', '.', 'The selected directory is not a complete Store Assets work package with ordinary entry files.');
      else {
        if (read(path.join(root, 'README.md')).includes('{{')) add('error', 'STATIC_README_TOKEN', 'README.md', 1, 'The static kit README must not contain placeholder tokens.');
        for (const area of ['current', 'release-prep', 'submissions', 'templates']) if (!fs.existsSync(path.join(root, store, area))) add('error', 'STORE_DIRECTORY', store + '/' + area, 1, 'Restore the required store directory.');
        const workingFiles = files(path.join(root, store, 'release-prep'));
        const currentFiles = files(path.join(root, store, 'current'));
        const inventories = checkInventories([...workingFiles, ...currentFiles]);
        const recordFiles = files(path.join(root, store, 'submissions')).filter(file => file.endsWith('.md'));
        const rulebooks = fs.readdirSync(root).filter(name => name.endsWith('-store-assets.md'));
        if (!rulebooks.length) add(workingFiles.length || recordFiles.length ? 'error' : 'info', 'RULEBOOK_MISSING', '.', 1, 'Initialize or restore the product rulebook before store work. An unused kit needs no generated rulebook yet.');
        if (rulebooks.length > 1) add('review', 'RULEBOOK_AMBIGUOUS', '.', 1, 'Multiple product rulebooks found; determine the applicable product rules.');
        const sourceVersion = read(path.join(root, 'templates/store-rulebook.md.template')).match(/^template_version:\s*([^\r\n]+)$/m)?.[1];
        if (!sourceVersion) add('error', 'TEMPLATE_VERSION', 'templates/store-rulebook.md.template', 1, 'Restore the source template_version marker; do not infer it from a toolkit release or local product version.');
        for (const name of rulebooks) if (safeFile(root, name, name, 1)) {
          const book = read(path.join(root, name)); tokens(book, name, true);
          if (book.match(/^template_version:\s*([^\r\n]+)$/m)?.[1] !== sourceVersion) add('review', 'RULEBOOK_VERSION', name, 1, 'Generated and source template markers differ; compare upstream/local changes without regenerating over adaptations.');
        }
        for (const file of [...workingFiles, ...currentFiles]) if (file.endsWith('.md')) {
          const name = slash(path.relative(root, file)), text = read(file);
          tokens(text, name);
          for (const link of localLinks(text)) {
            if (link.value === null) { add('review', 'ASSET_LINK_FORMAT', name, link.line, 'Local link has invalid URL escaping; review it manually.'); continue; }
            const resolvedLink = path.resolve(path.dirname(file), link.value);
            if (!within(root, resolvedLink)) { add('review', 'ASSET_LINK_SCOPE', name, link.line, 'Local link is outside this kit; its target was not read. Review the evidence/asset role.'); continue; }
            const relative = slash(path.relative(root, resolvedLink));
            const target = safeFile(root, relative, name, link.line);
            if (target && !fs.existsSync(target)) add('error', 'ASSET_LINK_MISSING', name, link.line, 'Referenced local asset/link target is missing: ' + link.value);
          }
        }
        const records = recordFiles.map(file => {
          const text = read(file), doc = document(text);
          const record = { ...doc, file: slash(path.relative(root, file)), refs: references(doc.sections.get('Submitted files')), modern: doc.sections.has('Events') && doc.sections.has('Submission attempts') };
          record.status = value(record, 'Status');
          record.locales = value(record, 'Locales').split(/[,\s]+/).filter(Boolean);
          record.attempts = blocks(doc.sections.get('Submission attempts'), 'Attempt'); record.events = blocks(doc.sections.get('Events'), 'Event');
          tokens(text, record.file);
          missingFields(record, record.modern ? HEADER : ['Submission ID', 'Status', 'Locales'], record.file, record.modern ? 'error' : 'review');
          if (!record.modern) add('review', 'LEGACY_RECORD', record.file, 1, 'Legacy/unstructured history: known fields are checked; missing evidence must be reviewed and merged deliberately.');
          if (!STATUSES.has(record.status)) add(record.modern || record.status ? 'error' : 'review', 'STATUS', record.file, record.fields.get('Status')?.line, 'Use a documented submission status where known; do not invent missing legacy state just to satisfy parsing.');
          const id = value(record, 'Submission ID'), stem = path.basename(file, '.md');
          if (id && (id !== stem || !/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || !validDate(id.slice(0, 10)))) add('error', 'RECORD_ID', record.file, 1, 'Repository submission ID must match its YYYY-MM-DD-task-name filename.');
          for (const key of ['Draft created date', 'Submission date', 'Publication date', 'Publication confirmed date']) if (value(record, key) && !validDate(value(record, key))) add(record.modern ? 'error' : 'review', 'DATE_FORMAT', record.file, record.fields.get(key)?.line, 'Use a real YYYY-MM-DD summary date, or leave an unknown summary empty.');
          for (const locale of record.locales) if (!localeName(locale)) add('error', 'LOCALE', record.file, record.fields.get('Locales')?.line, 'Locale has invalid language-tag syntax: ' + locale);
          record.locales = record.locales.filter(localeName);
          if (!record.locales.length) add(record.modern ? 'error' : 'review', 'LOCALE', record.file, 1, 'Record the affected locale scope.');
          const type = value(record, 'Update type');
          if (!['listing-only', 'package-update'].includes(type)) add(record.modern ? 'error' : 'review', 'UPDATE_TYPE', record.file, 1, 'Determine listing-only/package-update from evidence; legacy labels are not automatically converted.');
          if (type === 'listing-only') {
            if (unknown(value(record, 'Released application version')) || value(record, 'Application version') !== value(record, 'Released application version')) add(!record.modern && unknown(value(record, 'Released application version')) ? 'review' : 'error', 'LISTING_VERSION', record.file, 1, 'Listing-only updates retain the confirmed released application version.');
            for (const key of ['New package version', 'Package evidence']) if (value(record, key) !== 'Not applicable') add(record.modern ? 'error' : 'review', 'PACKAGE_APPLICABILITY', record.file, 1, key + ' must be Not applicable for listing-only.');
          }
          if (type === 'package-update') for (const key of ['Released application version', 'Application version', 'New package version', 'Package evidence']) {
            if (value(record, key) === 'Not applicable') add('error', 'PACKAGE_APPLICABILITY', record.file, 1, key + ' is applicable to a package update; record missing evidence as pending.');
            else if (unknown(value(record, key))) add('review', 'PACKAGE_PENDING', record.file, 1, key + ' is unresolved and blocks readiness; independent Draft work may continue.');
          }
          if (record.modern) for (const section of SECTIONS) if (!doc.sections.has(section)) add('error', 'MISSING_SECTION', record.file, 1, 'Add the record section: ' + section);
          if (doc.sections.get('Open items')?.some(row => row.text.trim() && !/^None\b/i.test(row.text.trim()))) add('review', 'OPEN_ITEMS', record.file, 1, 'Review the record open items; structural checks do not resolve them.');
          timeHistory(record); snapshots(record); checkReferences(record);
          return record;
        });
        const active = records.filter(record => ACTIVE.has(record.status));
        if (active.length > 1) add('error', 'MULTIPLE_ACTIVE', store + '/submissions', 1, 'Multiple active records: ' + active.map(record => value(record, 'Submission ID')).join(', ') + '. Resolve ownership/state without automatic withdrawal.');
        const waiting = records.filter(record => record.promotionPending);
        if (waiting.length && active.length) add('error', 'ARCHIVE_CONFLICT', store + '/submissions', 1, 'Resolve the Published record archive gap before another active preparation.');
        const owners = [...active, ...waiting];
        for (const file of workingFiles) {
          const relative = slash(path.relative(root, file));
          const matches = owners.filter(record => record.refs.some(ref => relative === ref.value || relative.startsWith(ref.value.replace(/\/$/, '') + '/')) ||
            record.refs.some(ref => ref.value.startsWith(store + '/release-prep/') && record.locales.includes(relative.split('/')[2]) && ref.value.split('/')[2] === relative.split('/')[2]));
          if (!matches.length) add('error', 'ORPHAN_CANDIDATE', relative, 1, 'Candidate has no unique active Draft/submission or pending-promotion record with explicit candidate references. Inspect and recover association; do not overwrite files.');
          else if (matches.length > 1) add('error', 'CANDIDATE_OWNERSHIP', relative, 1, 'More than one record claims this candidate scope.');
        }
        for (const record of owners) {
          for (const locale of record.locales) {
            const localFiles = workingFiles.filter(file => slash(path.relative(path.join(root, store, 'release-prep'), file)).split('/')[0] === locale);
            if (!localFiles.length) add('error', 'LOCALE_CANDIDATE_MISSING', record.file, 1, 'No candidate files for declared locale ' + locale + '; record incomplete preparation instead of claiming readiness.');
            else for (const required of ['listing.md', 'release-notes.md']) if (!fs.existsSync(path.join(root, store, 'release-prep', locale, required))) add('error', 'CANDIDATE_REQUIRED_FILE', record.file, 1, 'Complete the locale candidate: ' + locale + '/' + required);
          }
          for (const ref of record.refs) {
            const candidateLocale = ref.value.startsWith(store + '/release-prep/') ? ref.value.split('/')[2] : '';
            if (candidateLocale !== 'shared' && localeName(candidateLocale) && !record.locales.includes(candidateLocale)) {
              const looksLocalized = candidateLocale.includes('-') || ['listing.md', 'release-notes.md'].some(name => fs.existsSync(path.join(root, store, 'release-prep', candidateLocale, name)));
              add(looksLocalized ? 'error' : 'review', 'LOCALE_SCOPE', record.file, ref.line, 'Candidate root is absent from Locales or needs explicit shared-asset scope review: ' + candidateLocale);
            }
          }
          compareCandidate(record, workingFiles.filter(file => record.locales.includes(slash(path.relative(path.join(root, store, 'release-prep'), file)).split('/')[0]) ||
            record.refs.some(ref => slash(path.relative(root, file)).startsWith(ref.value.replace(/\/$/, '') + '/') || slash(path.relative(root, file)) === ref.value)));
          for (const inventory of inventories.filter(item => item.state === 'release-prep' && (record.locales.includes(item.scope) || record.refs.some(ref => item.name === ref.value || item.name.startsWith(ref.value.replace(/\/$/, '') + '/'))))) {
            const consumers = inventory.scope === 'shared' ? [...inventory.changedLocales || []] : inventory.assets.flatMap(asset => asset.locales);
            if (consumers.some(locale => !record.locales.includes(locale))) add('error', 'ASSET_RECORD_LOCALES', record.file, 1, 'Record Locales must include every consumer of changed/removed shared exports from ' + inventory.name + '.');
            for (const dependency of inventory.dependencies) if (!record.refs.some(ref => dependency === ref.value || dependency.startsWith(ref.value.replace(/\/$/, '') + '/'))) add('error', 'ASSET_RECORD_SCOPE', record.file, 1, 'Submitted files must cover inventory sources/exports, including the complete shared tree when used: ' + dependency);
            if ([...inventory.dependencies].some(dependency => dependency.startsWith(store + '/release-prep/shared/')) && !record.refs.some(ref => ref.value === store + '/release-prep/shared' || (store + '/release-prep/shared').startsWith(ref.value.replace(/\/$/, '') + '/'))) add('error', 'ASSET_RECORD_SHARED_SCOPE', record.file, 1, 'Reference the complete shared tree in Submitted files, not only individual shared source/export files.');
          }
        }
        if (!workingFiles.length && !records.length) add('info', 'NO_SUBMISSION', store, 1, 'No candidate content or submission records; empty directories/.gitkeep are not orphan candidates.');
      }
    }
  } catch (error) { fail('CHECK_INCOMPLETE', '.', 'Cannot complete read-only checks: ' + error.message); }
  const counts = { error: 0, review: 0, info: 0 };
  for (const finding of findings) counts[finding.level]++;
  return { schema_version: 1, root: root || path.resolve(input || '.'), store, exit_code: incomplete ? 2 : counts.error ? 1 : 0, counts, findings };
}

export function main(args = process.argv.slice(2)) {
  let root, store = 'microsoft-store', json = false;
  try {
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--root' && args[i + 1] && !args[i + 1].startsWith('--')) root = args[++i];
      else if (args[i] === '--store' && args[i + 1] && !args[i + 1].startsWith('--')) store = args[++i];
      else if (args[i] === '--json') json = true;
      else if (args[i] === '--help') { console.log('Usage: node scripts/check-store-assets.mjs --root <store-assets-folder> [--store microsoft-store] [--json]\nRead-only structural checks. No repairs, writes, or network access.'); return 0; }
      else throw new Error('Unknown or incomplete argument: ' + args[i]);
    }
    if (!root) throw new Error('--root is required; select the kit directory explicitly.');
    if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22 or later is required.');
    const report = checkStoreAssets(root, { store });
    if (json) console.log(JSON.stringify(report, null, 2));
    else {
      for (const finding of report.findings) console.log(finding.level.toUpperCase() + ' ' + finding.code + ' ' + finding.path + ':' + finding.line + ' — ' + finding.message);
      console.log(report.counts.error + ' errors, ' + report.counts.review + ' review items, ' + report.counts.info + ' info. Exit ' + report.exit_code + '.');
      console.log('A zero exit code is not submission readiness or proof of store publication.');
    }
    return report.exit_code;
  } catch (error) {
    const report = { schema_version: 1, exit_code: 2, counts: { error: 1, review: 0, info: 0 }, findings: [{ level: 'error', code: 'INPUT_ARGUMENT', path: '.', line: 1, message: error.message }] };
    if (json) console.log(JSON.stringify(report, null, 2)); else console.error('ERROR INPUT_ARGUMENT — ' + error.message);
    return 2;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
