[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$inputRoot = Join-Path $repoRoot 'tests/fixtures/update-tasks'
$historyFacts = Join-Path $repoRoot 'tests/fixtures/submission-history/facts.md'
$runRoot = Join-Path ([IO.Path]::GetTempPath()) ('store-assets-i2-' + [guid]::NewGuid().ToString('N'))
$utf8 = New-Object System.Text.UTF8Encoding($false)
$lf = [string][char]10
$passed = 0

function Check([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
    $script:passed++
}
function Write-Text([string]$Path, [string]$Text) {
    [IO.File]::WriteAllText($Path, $Text, $utf8)
}
function Invoke-FixtureGit([string]$Directory, [string[]]$Arguments, [int[]]$Expected = @(0)) {
    $ErrorActionPreference = 'Continue'
    $lines = @(& $script:gitExecutable -c ('core.hooksPath=' + (Join-Path $runRoot 'empty-hooks')) -C $Directory @Arguments 2>&1)
    $code = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    $result = [pscustomobject]@{ Code = $code; Text = [string]::Join($lf, @($lines | ForEach-Object { [string]$_ })) }
    if ($Expected -notcontains $code) { throw ('Git failed (' + $code + '): ' + [string]::Join(' ', $Arguments) + $lf + $result.Text) }
    return $result
}
function Commit([string]$Directory, [string]$Message) {
    $null = Invoke-FixtureGit -Directory $Directory -Arguments @('-c','commit.gpgsign=false','commit','--quiet','-m',$Message)
    return (Invoke-FixtureGit -Directory $Directory -Arguments @('rev-parse','--verify','HEAD')).Text.Trim()
}
function Assert-RunPath([string]$Path) {
    $absolute = [IO.Path]::GetFullPath($Path)
    $root = [IO.Path]::GetFullPath($runRoot).TrimEnd('\') + '\'
    if (-not $absolute.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { throw ('Unsafe mutation target: ' + $absolute) }
}
function Remove-RunPath([string]$Path) {
    Assert-RunPath $Path
    if (Test-Path -LiteralPath $Path) { Remove-Item -LiteralPath $Path -Recurse -Force }
}
function Signature([string]$Path) {
    return [string]::Join($lf, @(Get-ChildItem -LiteralPath $Path -File -Recurse -Force | Sort-Object FullName | ForEach-Object {
        $_.FullName.Substring($Path.Length) + '|' + (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    }))
}
function Blob([string]$Directory, [string]$CommitId, [string]$Path) {
    return (Invoke-FixtureGit -Directory $Directory -Arguments @('show', ($CommitId + ':' + $Path))).Text
}
function Attempt([int]$Number, [string]$CommitId, [string]$Verification = 'Verified') {
    $verifiedAt = [DateTimeOffset]::Now.ToString('o')
    if ($Verification -ne 'Verified') { $verifiedAt = 'Unknown' }
    return [string]::Join($lf, @(
        ('### Attempt ' + $Number), ('Snapshot commit: ' + $CommitId), 'Snapshot paths:',
        ('- ' + $script:prepPath), 'Approval source: history-facts.md (explicit fictional approval)',
        ('Snapshot verification: ' + $Verification), ('Verified at: ' + $verifiedAt)
    ))
}
function Event([int]$Number, [string]$Kind, [string]$AttemptNumber, [string]$Occurred, [string]$Zone,
               [string]$Observed, [string]$Recorded, [string]$Notes) {
    return [string]::Join($lf, @(
        ('### Event ' + $Number), ('Event: ' + $Kind), ('Attempt: ' + $AttemptNumber),
        ('Occurred at: ' + $Occurred), ('Occurred timezone: ' + $Zone),
        ('Observed at: ' + $Observed), ('Recorded at: ' + $Recorded),
        'Source: history-facts.md (supplied fictional evidence, not a real store observation)',
        ('Notes: ' + $Notes)
    ))
}
function Record([string]$Path, [string]$Id, [string]$Status, [string]$SubmittedDate,
                [string]$PlatformDate, [string]$ConfirmedDate, [string[]]$Attempts, [string[]]$Events,
                [string]$Open = 'Independent live-page comparison not performed; fixture markers are not upload-ready assets.') {
    $record = $script:recordSkeleton.Replace('{{SUBMISSION_ID}}', $Id)
    $createdDate = ''
    $creationEvent = @($Events | Where-Object { $_.Contains('Event: draft-created') } | Select-Object -First 1)
    if ($creationEvent.Count -gt 0) {
        $knownCreation = [regex]::Match($creationEvent[0], '(?m)^Occurred at: (\d{4}-\d{2}-\d{2})')
        if ($knownCreation.Success) { $createdDate = $knownCreation.Groups[1].Value }
    }
    $fields = [ordered]@{
        'Submission ID'=$Id; 'Draft created date'=$createdDate; 'Submission date'=$SubmittedDate;
        'Released application version'='1.0.0'; 'Application version'='1.0.0'; 'Update type'='listing-only';
        'New package version'='Not applicable'; 'Package evidence'='Not applicable';
        'Store submission ID'='Pending — not reported by the store'; 'Locales'='en-US'; 'Status'=$Status;
        'Publication date'=$PlatformDate; 'Publication confirmed date'=$ConfirmedDate
    }
    foreach ($key in $fields.Keys) {
        $record = [regex]::Replace($record, '(?m)^' + [regex]::Escape($key) + ':[^\r\n]*', ($key + ': ' + $fields[$key]).TrimEnd())
    }
    $attemptText = 'None — not frozen or submitted'
    if ($Attempts.Count -gt 0) { $attemptText = [string]::Join(($lf + $lf), $Attempts) }
    $sections = [ordered]@{
        '## Changes'='Approved fictional Logo refresh; preserve application version and unrelated assets.'
        '## Submitted files'=('Candidate navigation: microsoft-store/release-prep/en-US; durable references are in Submission attempts.')
        '## Submission attempts'=$attemptText
        '## Events'=([string]::Join(($lf + $lf), $Events))
        '## Open items'=$Open
        '## Certification result'='Only supplied fictional status events are represented.'
        '## Review notes'='Constructed artifact exercise, not a fresh-agent or real store result.'
    }
    foreach ($heading in $sections.Keys) { $record = $record.Replace($heading, $heading + $lf + $lf + $sections[$heading]) }
    Write-Text $Path ($record + $lf)
    return $record
}
function Freeze([string]$Directory, [string]$Message) {
    $null = Invoke-FixtureGit -Directory $Directory -Arguments @('--literal-pathspecs','add','--all','--',$script:prepPath)
    $id = Commit $Directory $Message
    $resolved = (Invoke-FixtureGit -Directory $Directory -Arguments @('rev-parse','--verify','--end-of-options',($id + '^{commit}'))).Text.Trim()
    Check ($resolved -eq $id) 'Snapshot did not resolve to its full commit ID'
    $status = (Invoke-FixtureGit -Directory $Directory -Arguments @('--literal-pathspecs','status','--porcelain=v1','--untracked-files=all','--ignored','--',$script:prepPath)).Text
    Check ([string]::IsNullOrWhiteSpace($status)) 'Frozen candidate has uncommitted/untracked/ignored content'
    $diff = Invoke-FixtureGit -Directory $Directory -Arguments @('--literal-pathspecs','diff','--exit-code',$id,'--',$script:prepPath)
    Check ($diff.Code -eq 0) 'Frozen candidate differs from snapshot'
    $stored = (Invoke-FixtureGit -Directory $Directory -Arguments @('ls-tree','-r','--name-only',$id,'--',$script:prepPath)).Text
    Check ($stored.Contains('/listing.md') -and $stored.Contains('/release-notes.md') -and $stored.Contains('/logos/store-logo.svg')) 'Snapshot does not cover the complete intended tree'
    return $id
}
function Promote([string]$Directory, [string]$Kit, [string]$CommitId) {
    $candidate = Join-Path $Kit 'microsoft-store/release-prep/en-US'
    $current = Join-Path $Kit 'microsoft-store/current/en-US'
    $null = Invoke-FixtureGit -Directory $Directory -Arguments @('--literal-pathspecs','diff','--exit-code',$CommitId,'--',$script:prepPath)
    $status = (Invoke-FixtureGit -Directory $Directory -Arguments @('--literal-pathspecs','status','--porcelain=v1','--untracked-files=all','--ignored','--',$script:prepPath)).Text
    Check ([string]::IsNullOrWhiteSpace($status)) 'Promotion candidate is dirty or incomplete'
    $approved = Signature $candidate
    Remove-RunPath $current
    Copy-Item -LiteralPath $candidate -Destination $current -Recurse
    Check ((Signature $current) -eq $approved) 'Promotion did not exactly replace the locale tree'
    Remove-RunPath $candidate
}

$script:gitExecutable = (Get-Command git -CommandType Application -ErrorAction Stop).Source
New-Item -ItemType Directory -Path $runRoot | Out-Null
try {
    New-Item -ItemType Directory -Path (Join-Path $runRoot 'empty-hooks') | Out-Null
    $app = Join-Path $runRoot 'application'
    New-Item -ItemType Directory -Path $app | Out-Null
    Get-ChildItem -LiteralPath (Join-Path $inputRoot 'application') -Force | Copy-Item -Destination $app -Recurse
    Copy-Item -LiteralPath (Join-Path $repoRoot 'starter-kit') -Destination (Join-Path $app 'store-assets') -Recurse
    Copy-Item -LiteralPath $historyFacts -Destination (Join-Path $app 'history-facts.md')
    $kit = Join-Path $app 'store-assets'
    $current = Join-Path $kit 'microsoft-store/current/en-US'
    $candidate = Join-Path $kit 'microsoft-store/release-prep/en-US'
    $script:prepPath = 'store-assets/microsoft-store/release-prep/en-US'
    $logoPath = $script:prepPath + '/logos/store-logo.svg'
    Copy-Item -LiteralPath (Join-Path $inputRoot 'published') -Destination $current -Recurse
    Copy-Item -LiteralPath (Join-Path $current 'logos/store-logo.svg') -Destination (Join-Path $current 'logos/obsolete-logo.svg')
    $template = [IO.File]::ReadAllText((Join-Path $kit 'templates/store-rulebook.md.template'))
    $version = [regex]::Match($template, '(?m)^template_version: ([^\r\n]+)').Groups[1].Value
    $values = @{
        '{{PRODUCT_NAME}}'='Northstar Notes'; '{{STORE_PLATFORM}}'='microsoft-store';
        '{{STORE_DISPLAY_NAME}}'='Microsoft Store'; '{{DEFAULT_LOCALE}}'='en-US';
        '{{CURRENT_APP_VERSION}}'='1.0.0'; '{{RULEBOOK_FILE}}'='northstar-notes-store-assets.md';
        '{{TEMPLATE_VERSION}}'=$version
    }
    foreach ($key in $values.Keys) { $template = $template.Replace($key, $values[$key]) }
    $remaining = @([regex]::Matches($template, '\{\{([A-Z_]+)\}\}') | ForEach-Object { $_.Groups[1].Value })
    Check (@($remaining | Where-Object { @('LOCALE','SUBMISSION_ID','APPLICATION_VERSION','PUBLICATION_DATE','STATUS') -notcontains $_ }).Count -eq 0) 'Unresolved project variable in generated standalone rulebook'
    Write-Text (Join-Path $kit 'northstar-notes-store-assets.md') $template
    $fence = ([string][char]96) * 3
    $match = [regex]::Match($template, '(?s)' + $fence + 'markdown\r?\n(# Northstar Notes Microsoft Store Submission.*?)\r?\n' + $fence)
    Check $match.Success 'Current record skeleton not found'
    $script:recordSkeleton = $match.Groups[1].Value
    Write-Text (Join-Path $app '.gitattributes') ('* text=auto eol=lf' + $lf)
    Write-Text (Join-Path $app '.gitignore') ('*.ignored' + $lf)
    $null = Invoke-FixtureGit -Directory $app -Arguments @('init','--quiet','--initial-branch=main')
    foreach ($setting in @(@('user.name','Store Assets Fixture'),@('user.email','fixture@example.invalid'),@('core.autocrlf','false'))) {
        $null = Invoke-FixtureGit -Directory $app -Arguments @('config','--local',$setting[0],$setting[1])
    }
    $null = Invoke-FixtureGit -Directory $app -Arguments @('add','--all')
    $null = Commit $app 'Fixture published baseline'

    $recordPath = Join-Path $kit 'microsoft-store/submissions/2026-10-22-logo-refresh.md'
    $events = @((Event 1 'draft-created' 'Not applicable' '2026-10-22T17:00:00+08:00' '+08:00' '2026-10-22T17:00:00+08:00' '2026-10-22T17:00:00+08:00' 'Local fictional Draft creation, not a store event.'))
    $null = Record $recordPath '2026-10-22-logo-refresh' 'Draft' '' '' '' @() $events
    $before = Signature $current
    Copy-Item -LiteralPath $current -Destination $candidate -Recurse
    Copy-Item -LiteralPath (Join-Path $inputRoot 'replacement-logo.svg') -Destination (Join-Path $candidate 'logos/store-logo.svg')
    $snapshot1 = Freeze $app 'Fixture approved candidate attempt 1'
    Check ((Signature $current) -eq $before) 'Preparing attempt 1 changed current'
    $absentRecord = Invoke-FixtureGit -Directory $app -Arguments @('cat-file','-e',($snapshot1 + ':store-assets/microsoft-store/submissions/2026-10-22-logo-refresh.md')) -Expected @(128)
    Check ($absentRecord.Code -eq 128) 'Assets commit unexpectedly needed to include its own referencing record'
    $originalLogo = Blob $app $snapshot1 $logoPath
    $attempts = @((Attempt 1 $snapshot1))
    $events += Event 2 'submitted' '1' 'Unknown' 'Unknown' '2026-10-22T18:00:00+08:00' '2026-10-22T18:05:00+08:00' 'Actual submission time unknown; user-reported.'
    $unknownSubmission = Record $recordPath '2026-10-22-logo-refresh' 'Submitted' '' '' '' $attempts $events
    Check ([regex]::IsMatch($unknownSubmission,'(?m)^Submission date:\r?$')) 'Unknown submission date was filled from filename/observation'
    $events += Event 3 'status-observed' '1' 'Unknown' 'Unknown' '2026-10-23T08:00:00+08:00' '2026-10-23T08:05:00+08:00' 'Status: Rejected; confirmed fixture review fixes follow.'
    $null = Record $recordPath '2026-10-22-logo-refresh' 'Rejected' '' '' '' $attempts $events
    $events += Event 4 'draft-reopened' '1' '2026-10-23T08:15:00+08:00' '+08:00' '2026-10-23T08:15:00+08:00' '2026-10-23T08:15:00+08:00' 'Local Draft transition authorized by the confirmed review-fix task.'
    $null = Record $recordPath '2026-10-22-logo-refresh' 'Draft' '' '' '' $attempts $events
    $correctedLogo = $originalLogo.Replace('Fictional replacement file marker','Fictional corrected attempt 2 marker')
    Write-Text (Join-Path $candidate 'logos/store-logo.svg') ($correctedLogo + $lf)
    Remove-RunPath (Join-Path $candidate 'logos/obsolete-logo.svg')
    $snapshot2 = Freeze $app 'Fixture approved corrected candidate attempt 2'
    Check ($snapshot1 -ne $snapshot2) 'Corrected assets did not receive a distinct snapshot'
    Check ((Signature $current) -eq $before) 'Review fixes changed current before confirmation'
    $attempts += Attempt 2 $snapshot2
    $events += Event 5 'submitted' '2' '2026-10-23' 'Asia/Shanghai' '2026-10-23T08:45:00+08:00' '2026-10-23T08:50:00+08:00' 'Date-only actual submission evidence; no midnight inferred.'
    $null = Record $recordPath '2026-10-22-logo-refresh' 'Submitted' '2026-10-23' '' '' $attempts $events
    $events += Event 6 'go-live-confirmed' '2' '2026-10-23T09:00:00+08:00' '+08:00' '2026-10-23T09:00:00+08:00' '2026-10-23T09:05:00+08:00' 'Explicit user confirmation for attempt 2; platform publication date/time unknown.'
    $confirmed = Record $recordPath '2026-10-22-logo-refresh' 'Published' '2026-10-23' '' '2026-10-23' $attempts $events
    Check ([regex]::IsMatch($confirmed,'(?m)^Publication date:\r?$') -and $confirmed.Contains('Publication confirmed date: 2026-10-23')) 'Confirmation was conflated with platform time'
    Promote $app $kit $snapshot2
    Check (-not (Test-Path -LiteralPath (Join-Path $current 'logos/obsolete-logo.svg'))) 'Planned removal remained live'
    $events += Event 7 'promoted' '2' '2026-10-23T09:10:00+08:00' '+08:00' '2026-10-23T09:10:00+08:00' '2026-10-23T09:10:00+08:00' 'Local archive completed; no independent live-page comparison.'
    $firstRecord = Record $recordPath '2026-10-22-logo-refresh' 'Published' '2026-10-23' '' '2026-10-23' $attempts $events
    $null = Invoke-FixtureGit -Directory $app -Arguments @('add','--all')
    $null = Commit $app 'Fixture first publication archive'
    Write-Output 'PASS: rejected attempt retained, corrected attempt frozen, exact first promotion/removal, no self-referencing commit requirement.'

    $firstLive = Signature $current
    Copy-Item -LiteralPath $current -Destination $candidate -Recurse
    Write-Text (Join-Path $candidate 'logos/store-logo.svg') ($correctedLogo.Replace('attempt 2','second publication') + $lf)
    $snapshot3 = Freeze $app 'Fixture second submission approved candidate'
    Check ((Signature $current) -eq $firstLive) 'Second preparation changed current prematurely'
    $secondEvents = @(
        (Event 1 'draft-created' 'Not applicable' '2026-10-24T08:00:00+08:00' '+08:00' '2026-10-24T08:00:00+08:00' '2026-10-24T08:00:00+08:00' 'Separate approved listing-only task.'),
        (Event 2 'submitted' '1' '2026-10-24' 'Asia/Shanghai' '2026-10-24T09:00:00+08:00' '2026-10-24T09:05:00+08:00' 'Actual submission date known at day precision.'),
        (Event 3 'go-live-confirmed' '1' '2026-10-24T10:00:00+08:00' '+08:00' '2026-10-24T10:00:00+08:00' '2026-10-24T10:05:00+08:00' 'Explicit fictional confirmation; platform date/time unknown.')
    )
    $secondRecordPath = Join-Path $kit 'microsoft-store/submissions/2026-10-24-second-refresh.md'
    $null = Record $secondRecordPath '2026-10-24-second-refresh' 'Published' '2026-10-24' '' '2026-10-24' @((Attempt 1 $snapshot3)) $secondEvents
    Promote $app $kit $snapshot3
    $secondEvents += Event 4 'promoted' '1' '2026-10-24T10:10:00+08:00' '+08:00' '2026-10-24T10:10:00+08:00' '2026-10-24T10:10:00+08:00' 'Second local archive completed.'
    $null = Record $secondRecordPath '2026-10-24-second-refresh' 'Published' '2026-10-24' '' '2026-10-24' @((Attempt 1 $snapshot3)) $secondEvents
    $null = Invoke-FixtureGit -Directory $app -Arguments @('add','--all')
    $null = Commit $app 'Fixture second publication archive'
    Check ((Blob $app $snapshot1 $logoPath) -eq $originalLogo) 'Attempt 1 content lost after later publications'
    Check ((Blob $app $snapshot2 $logoPath) -eq $correctedLogo) 'Attempt 2 content lost after later publications'
    $oldRemoval = Invoke-FixtureGit -Directory $app -Arguments @('cat-file','-e',($snapshot1 + ':' + $script:prepPath + '/logos/obsolete-logo.svg'))
    Check ($oldRemoval.Code -eq 0) 'Removed historical asset no longer resolves'
    Check ([IO.File]::ReadAllText($recordPath).Contains($snapshot1) -and [IO.File]::ReadAllText($recordPath).Contains($snapshot2)) 'Old record references changed'
    Check (-not (Test-Path -LiteralPath $candidate)) 'Completed preparation was not removed'
    Write-Output 'PASS: second publication replaces live assets while both original attempt trees and removed historical assets remain retrievable.'

    Copy-Item -LiteralPath $current -Destination $candidate -Recurse
    $cleanSnapshot = Freeze $app 'Fixture snapshot for mismatch cases'
    $cleanLogo = [IO.File]::ReadAllText((Join-Path $candidate 'logos/store-logo.svg'))
    Write-Text (Join-Path $candidate 'logos/store-logo.svg') ($cleanLogo + '<!-- unapproved later edit -->' + $lf)
    $dirty = Invoke-FixtureGit -Directory $app -Arguments @('--literal-pathspecs','diff','--exit-code',$cleanSnapshot,'--',$script:prepPath) -Expected @(1)
    Check ($dirty.Code -eq 1) 'Dirty candidate mismatch not detected'
    Write-Text (Join-Path $candidate 'logos/store-logo.svg') $cleanLogo
    Write-Text (Join-Path $candidate 'extra.svg') '<svg xmlns="http://www.w3.org/2000/svg"/>'
    Write-Text (Join-Path $candidate 'extra.ignored') 'Intended fixture asset omitted from Git'
    $emptyDiff = Invoke-FixtureGit -Directory $app -Arguments @('--literal-pathspecs','diff','--exit-code',$cleanSnapshot,'--',$script:prepPath)
    $omissions = (Invoke-FixtureGit -Directory $app -Arguments @('--literal-pathspecs','status','--porcelain=v1','--untracked-files=all','--ignored','--',$script:prepPath)).Text
    Check ($emptyDiff.Code -eq 0 -and $omissions.Contains('?? ') -and $omissions.Contains('!! ')) 'Untracked/ignored omissions were not distinguished from clean tracked diff'
    $gapRecordPath = Join-Path $kit 'microsoft-store/submissions/2026-10-25-gap.md'
    $gapEvent = Event 1 'go-live-confirmed' '1' '2026-10-23T09:00:00+08:00' '+08:00' '2026-10-23T09:00:00+08:00' '2026-10-23T09:05:00+08:00' 'Alternate fixture state: live report received, local candidate no longer matches.'
    $gapRecord = Record $gapRecordPath '2026-10-25-gap' 'Published' '' '' '2026-10-23' @((Attempt 1 $cleanSnapshot 'Pending — working candidate differs and intended assets are not stored')) @($gapEvent) 'Promotion pending; preserve candidate; reported external publication is retained.'
    Check ($gapRecord.Contains('Status: Published') -and $gapRecord.Contains('Snapshot verification: Pending') -and -not $gapRecord.Contains('Event: promoted')) 'Local evidence gap lost external status or fabricated promotion'
    Check (Test-Path -LiteralPath $candidate) 'Gap handling deleted the candidate'
    Write-Output 'PASS: dirty, untracked and ignored candidate gaps remain explicit; external Published fact does not fabricate local promotion.'

    $shallow = Join-Path $runRoot 'shallow'
    $sourceUri = ([Uri]$app).AbsoluteUri
    $null = Invoke-FixtureGit -Directory $runRoot -Arguments @('clone','--quiet','--depth','1','--no-local',$sourceUri,$shallow)
    $isShallow = (Invoke-FixtureGit -Directory $shallow -Arguments @('rev-parse','--is-shallow-repository')).Text.Trim()
    $missing = Invoke-FixtureGit -Directory $shallow -Arguments @('cat-file','-e',($snapshot1 + '^{commit}')) -Expected @(128)
    Check ($isShallow -eq 'true' -and $missing.Code -eq 128) 'Shallow fixture unexpectedly contains old snapshot'
    $available = Invoke-FixtureGit -Directory $shallow -Arguments @('rev-parse','--verify','--end-of-options',($cleanSnapshot + '^{commit}'))
    Check ($available.Text.Trim() -eq $cleanSnapshot) 'Available shallow snapshot was incorrectly rejected'
    $shallowRecord = Join-Path $shallow 'store-assets/microsoft-store/submissions/2026-10-22-logo-refresh.md'
    Check ([IO.File]::ReadAllText($shallowRecord).Contains($snapshot1)) 'Missing-history reference was replaced by shallow HEAD'
    $shallowText = [IO.File]::ReadAllText($shallowRecord)
    $shallowText = $shallowText.Replace('## Open items', '## Open items' + $lf + $lf + 'Snapshot verification pending on this checkout: Attempt 1 object unavailable; preserve its recorded ID, do not replace with HEAD.')
    Write-Text $shallowRecord $shallowText
    Check ($shallowText.Contains($snapshot1) -and $shallowText.Contains('Snapshot verification pending on this checkout')) 'Missing shallow object was not recorded as a visible gap'
    $badPath = Invoke-FixtureGit -Directory $app -Arguments @('cat-file','-e',($snapshot1 + ':' + $script:prepPath + '/nonexistent.svg')) -Expected @(128)
    Check ($badPath.Code -eq 128) 'Missing historical path unexpectedly resolved'
    $outsideGit = Join-Path $runRoot 'outside-git'
    New-Item -ItemType Directory -Path $outsideGit | Out-Null
    Copy-Item -LiteralPath (Join-Path $repoRoot 'starter-kit') -Destination (Join-Path $outsideGit 'store-assets') -Recurse
    $notGit = Invoke-FixtureGit -Directory $outsideGit -Arguments @('rev-parse','--show-toplevel') -Expected @(128)
    Check ($notGit.Code -eq 128 -and -not (Test-Path -LiteralPath (Join-Path $outsideGit '.git'))) 'Non-Git preparation silently initialized a repository'
    Write-Output 'PASS: unavailable shallow history is not replaced with HEAD; available shallow objects resolve; non-Git copy remains uninitialized.'

    Check ($firstRecord.Contains('Occurred at: 2026-10-23' + $lf + 'Occurred timezone: Asia/Shanghai')) 'Date-only submission precision/timezone lost'
    $confirmationEvent = $events[5]
    $events += Event 8 'platform-published' '2' '2026-10-23' 'Asia/Shanghai' '2026-10-25T10:00:00+08:00' '2026-10-25T10:05:00+08:00' 'Later supplied platform date only; original source observation time unknown.'
    $laterRecord = Record $recordPath '2026-10-22-logo-refresh' 'Published' '2026-10-23' '2026-10-23' '2026-10-23' $attempts $events
    Check ($laterRecord.Contains($confirmationEvent) -and $laterRecord.Contains('Publication date: 2026-10-23')) 'Later evidence rewrote confirmation history or used its observation date'
    Check (-not $laterRecord.Contains('2026-10-23T00:00:00')) 'Date precision turned into invented midnight'
    $legacy = 'Publication date: 2026-10-09' + $lf
    $legacy += $lf + '## Review notes' + $lf + 'Legacy value preserved; platform-versus-confirmation meaning unknown. Original observation time unknown.' + $lf
    $legacyPath = Join-Path $outsideGit 'legacy-record.md'
    Write-Text $legacyPath $legacy
    Check ([IO.File]::ReadAllText($legacyPath).StartsWith('Publication date: 2026-10-09' + $lf)) 'Legacy date was silently reinterpreted'
    Write-Output 'PASS: unknown occurrence, observation/recording separation, date precision, later platform evidence and legacy-date ambiguity retained.'
    Write-Output ('Artifact exercise PASS: ' + $passed + ' assertions. Constructed artifacts only; fresh-agent verification not run.')
}
finally {
    $absoluteRoot = [IO.Path]::GetFullPath($runRoot)
    $tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
    if (-not $absoluteRoot.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase) -or -not ([IO.Path]::GetFileName($absoluteRoot)).StartsWith('store-assets-i2-')) { throw 'Unsafe fixture cleanup root' }
    if (Test-Path -LiteralPath $absoluteRoot) { Remove-Item -LiteralPath $absoluteRoot -Recurse -Force }
    if (Test-Path -LiteralPath $absoluteRoot) { throw 'Fixture cleanup residue' }
    Write-Output 'Cleanliness PASS: disposable Git repositories and artifacts removed; source repository unchanged by exercise.'
}
