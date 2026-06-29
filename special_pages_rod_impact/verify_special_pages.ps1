$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$SiteDir = Join-Path $Root "site"
$DownloadsDir = Join-Path $Root "downloads"
$IndexPath = Join-Path $SiteDir "index.html"
$StylesPath = Join-Path $SiteDir "styles.css"
$ReadmePath = Join-Path $Root "README.zh-CN.md"
$ZipName = "lsprepost-mcp-special-rod-impact.zip"
$ZipPath = Join-Path $DownloadsDir $ZipName

function Assert-FileExists {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Missing required file: $Path"
    }
}

Assert-FileExists $IndexPath
Assert-FileExists $StylesPath
Assert-FileExists $ReadmePath
Assert-FileExists $ZipPath

$index = Get-Content -LiteralPath $IndexPath -Raw -Encoding UTF8
$readme = Get-Content -LiteralPath $ReadmePath -Raw -Encoding UTF8

$requiredIndexText = @(
    "rod_impact_plate",
    "downloads/$ZipName",
    "GitHub Pages",
    "Python",
    "LS-PrePost",
    "start_web_app.cmd"
)

foreach ($text in $requiredIndexText) {
    if (-not $index.Contains($text)) {
        throw "index.html is missing required text: $text"
    }
}

$requiredReadmeText = @(
    "GitHub Pages",
    "Python",
    "start_web_app.cmd",
    $ZipName
)

foreach ($text in $requiredReadmeText) {
    if (-not $readme.Contains($text)) {
        throw "README.zh-CN.md is missing required text: $text"
    }
}

if ($index -notmatch '<meta charset="utf-8"') {
    throw "index.html must declare UTF-8 charset."
}

$zip = Get-Item -LiteralPath $ZipPath
if ($zip.Length -le 0) {
    throw "Download zip is empty: $ZipPath"
}

Write-Output "Special Pages verification passed."
