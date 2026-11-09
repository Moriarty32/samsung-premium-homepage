[CmdletBinding()]
param(
    [string]$RestoreRef = 'refs/tags/backup/before-home-merchandising-20261109',
    [switch]$Publish,
    [switch]$Preview
)
$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $repositoryRoot
try {
    $resolvedRoot = (& git rev-parse --show-toplevel).Trim()
    if ($LASTEXITCODE -ne 0) { throw 'The script must run inside this Git repository.' }
    $targetCommit = (& git rev-parse --verify "$RestoreRef^{commit}").Trim()
    if ($LASTEXITCODE -ne 0) { throw "Restore point not found: $RestoreRef" }
    Write-Host "Restore point: $targetCommit"
    & git log -1 --format='%h %s' $targetCommit
    & git diff --stat HEAD $targetCommit -- .
    if ($Preview) {
        Write-Host 'Preview only. No files, commits or deployed pages were changed.'
        return
    }
    $pendingChanges = & git status --porcelain
    if ($pendingChanges) { throw 'Commit or save current local changes before restoring. Nothing has been changed.' }
    $currentBranch = (& git branch --show-current).Trim()
    if (-not $currentBranch) { throw 'Check out a local branch before restoring.' }
    # Restore the entire tracked snapshot, including deleting files added later.
    # The original history and backup tag remain intact. No reset or force push.
    & git restore "--source=$targetCommit" --staged --worktree -- .
    if ($LASTEXITCODE -ne 0) { throw 'Git could not restore the snapshot.' }
    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host 'The page already matches the selected restore point.'
    } else {
        & git commit -m "Restore homepage to $($targetCommit.Substring(0,7))"
        if ($LASTEXITCODE -ne 0) { throw 'The restored files are staged, but the restore commit failed.' }
        Write-Host 'The previous page is restored in a new commit.'
    }
    if ($Publish) {
        & git push origin "HEAD:refs/heads/$currentBranch"
        if ($LASTEXITCODE -ne 0) { throw 'The local restore succeeded, but publication failed. Retry git push.' }
        Write-Host 'Pushed. GitHub Pages will publish the restored version after its deployment finishes.'
    }
} finally {
    Pop-Location
}
