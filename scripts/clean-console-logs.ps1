# clean-console-logs.ps1 - PowerShell script to remove console.log statements
param (
    [switch]$DryRun = $false,
    [string]$Path = "src/",
    [switch]$Verbose = $false
)

Write-Host "🧹 Starting console.log cleanup..." -ForegroundColor Green

# Define file patterns to search
$filePatterns = @("*.ts", "*.tsx", "*.js", "*.jsx")

# Patterns to match console.log statements (but preserve console.error, console.warn, etc.)
$consoleLogPattern = '^\s*console\.log\([^)]*\);\s*$'
$consoleLogInlinePattern = '\s*console\.log\([^)]*\);\s*'

# Get all files to process
$files = Get-ChildItem -Path $Path -Recurse -Include $filePatterns -File

Write-Host "Found $($files.Count) files to process" -ForegroundColor Cyan

$totalRemovals = 0
$filesModified = 0

foreach ($file in $files) {
    if ($Verbose) {
        Write-Host "Processing: $($file.FullName)" -ForegroundColor Gray
    }
    
    $content = Get-Content $file.FullName -Raw
    $originalLineCount = ($content -split "`n").Count
    
    # Track removals for this file
    $fileRemovals = 0
    
    # Remove standalone console.log lines
    $newContent = $content -replace $consoleLogPattern, ''
    
    # Count standalone removals
    $standaloneRemovals = [regex]::Matches($content, $consoleLogPattern).Count
    $fileRemovals += $standaloneRemovals
    
    # Remove inline console.log statements (more careful approach)
    $lines = $newContent -split "`n"
    $processedLines = @()
    
    foreach ($line in $lines) {
        # Skip empty lines that were console.log only
        if ($line -match '^\s*$' -and $content -match $consoleLogPattern) {
            continue
        }
        
        # Remove inline console.log but keep the rest of the line
        $originalLine = $line
        $line = $line -replace '\s*console\.log\([^)]*\);\s*', ''
        
        # Count inline removals
        if ($originalLine -ne $line -and $originalLine -match 'console\.log') {
            $inlineRemovals = [regex]::Matches($originalLine, 'console\.log\([^)]*\)').Count
            $fileRemovals += $inlineRemovals
        }
        
        $processedLines += $line
    }
    
    $finalContent = $processedLines -join "`n"
    $newLineCount = ($finalContent -split "`n").Count
    
    # Only proceed if there were actual changes
    if ($fileRemovals -gt 0) {
        $filesModified++
        $totalRemovals += $fileRemovals
        
        Write-Host "  📝 $($file.Name): Removed $fileRemovals console.log statement(s)" -ForegroundColor Yellow
        
        if (!$DryRun) {
            # Write the cleaned content back to file
            $finalContent | Set-Content -Path $file.FullName -NoNewline
        }
        
        if ($Verbose) {
            Write-Host "    Lines: $originalLineCount → $newLineCount" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host "Files processed: $($files.Count)" -ForegroundColor Cyan
Write-Host "Files modified: $filesModified" -ForegroundColor Cyan
Write-Host "Total console.log statements removed: $totalRemovals" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host ""
    Write-Host "⚠️  DRY RUN MODE - No files were actually modified" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply changes" -ForegroundColor Yellow
}

# Show remaining console statements (should only be error, warn, info, etc.)
$remainingConsole = Get-ChildItem -Path $Path -Recurse -Include $filePatterns | Select-String -Pattern "console\." | Where-Object { $_ -notmatch "console\.log" }

if ($remainingConsole.Count -gt 0) {
    Write-Host ""
    Write-Host "ℹ️  Remaining console statements (preserved):" -ForegroundColor Blue
    $remainingConsole | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor Gray
    }
    
    if ($remainingConsole.Count -gt 5) {
        Write-Host "  ... and $($remainingConsole.Count - 5) more" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🎉 Console.log cleanup completed successfully!" -ForegroundColor Green
