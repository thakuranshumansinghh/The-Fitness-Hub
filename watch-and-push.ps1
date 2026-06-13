# watch-and-push.ps1
# Watches the current directory for changes and automatically commits/pushes to Git

$Watcher = New-Object System.IO.FileSystemWatcher
$Watcher.Path = $PSScriptRoot
$Watcher.Filter = "*.*"
$Watcher.IncludeSubdirectories = $true
$Watcher.EnableRaisingEvents = $true

$Action = {
    $path = $Event.SourceEventArgs.FullPath
    
    # Ignore git internals, system generated files, vercel caching, and temporary log files
    if ($path -match '\\.git\\' -or $path -match '\\.vercel\\' -or $path -match 'watch-and-push' -or $path -match '\\.system_generated\\' -or $path -match 'bookings.json' -or $path -match 'admin-users.json') {
        return
    }
    
    Write-Host "File changed: $path - Committing and pushing changes..."
    git add .
    git commit -m "auto: synchronize updates"
    git push origin $(git branch --show-current)
}

# Register events for file modifications
$handlers = @()
$handlers += Register-ObjectEvent $Watcher "Changed" -Action $Action
$handlers += Register-ObjectEvent $Watcher "Created" -Action $Action
$handlers += Register-ObjectEvent $Watcher "Deleted" -Action $Action

Write-Host "File watcher active! Any edit will be pushed to GitHub automatically."
Write-Host "Press Ctrl+C in this terminal to stop watching."

try {
    while ($true) {
        Start-Sleep -Seconds 2
    }
} finally {
    # Clean up event handlers on exit
    foreach ($h in $handlers) {
        Unregister-Event -SourceIdentifier $h.Name -ErrorAction SilentlyContinue
    }
}
