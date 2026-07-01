$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$SiteDir = Join-Path $Root "site"
$DownloadsDir = Join-Path $Root "downloads"
$IndexPath = Join-Path $SiteDir "index.html"
$StylesPath = Join-Path $SiteDir "styles.css"
$AgentPath = Join-Path $SiteDir "agent.js"
$ReadmePath = Join-Path $Root "README.zh-CN.md"
$ZipName = "lsprepost-mcp-special-rod-impact.zip"
$ZipPath = Join-Path $DownloadsDir $ZipName

function Assert-FileExists {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Missing required file: $Path"
    }
}

function Assert-Contains {
    param(
        [string]$Label,
        [string]$Content,
        [string]$Text
    )
    if (-not $Content.Contains($Text)) {
        throw "$Label is missing required text: $Text"
    }
}

Assert-FileExists $IndexPath
Assert-FileExists $StylesPath
Assert-FileExists $AgentPath
Assert-FileExists $ReadmePath
Assert-FileExists $ZipPath

$index = Get-Content -LiteralPath $IndexPath -Raw -Encoding UTF8
$styles = Get-Content -LiteralPath $StylesPath -Raw -Encoding UTF8
$agent = Get-Content -LiteralPath $AgentPath -Raw -Encoding UTF8
$readme = Get-Content -LiteralPath $ReadmePath -Raw -Encoding UTF8

$requiredIndexText = @(
    '<meta charset="utf-8">',
    "rod_impact_plate",
    "../downloads/$ZipName",
    "qwen-plus",
    "apiKeyInput",
    "chatMessages",
    "agent.js",
    "LS-PrePost",
    "Python"
)
foreach ($text in $requiredIndexText) {
    Assert-Contains "index.html" $index $text
}

$requiredStyleText = @(
    "workbench-shell",
    "left-panel",
    "viewer-panel",
    "agent-panel",
    "chat-messages"
)
foreach ($text in $requiredStyleText) {
    Assert-Contains "styles.css" $styles $text
}

$requiredAgentText = @(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    "sessionStorage",
    "qwen-plus",
    "Authorization",
    "Bearer"
)
foreach ($text in $requiredAgentText) {
    Assert-Contains "agent.js" $agent $text
}

$requiredReadmeText = @(
    "GitHub Pages",
    "qwen-plus",
    "API Key",
    $ZipName
)
foreach ($text in $requiredReadmeText) {
    Assert-Contains "README.zh-CN.md" $readme $text
}

$forbiddenText = @(
    "Pages 可以运行",
    "在线生成 keyword",
    "直接运行 Python"
)
foreach ($text in $forbiddenText) {
    if ($index.Contains($text) -or $readme.Contains($text)) {
        throw "Misleading Pages capability text found: $text"
    }
}

$zip = Get-Item -LiteralPath $ZipPath
if ($zip.Length -le 0) {
    throw "Download zip is empty: $ZipPath"
}

Write-Output "Special workbench verification passed."
