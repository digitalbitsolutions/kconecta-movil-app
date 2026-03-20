param(
    [ValidateSet("plan", "patch", "review", "custom")]
    [string]$Mode = "plan",

    [Parameter(Mandatory = $true)]
    [string]$Task,

    [string[]]$Files = @(),

    [string]$Model = "deepseek-coder-v2:16b",

    [string]$RepoPath = (Get-Location).Path,

    [string]$OutputFile = "",

    [string]$OllamaBaseUrl = "http://127.0.0.1:11434"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-TrimmedFileContext {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [int]$MaxLines = 250
    )

    if (-not (Test-Path $FilePath)) {
        return "FILE NOT FOUND: $FilePath"
    }

    $lines = Get-Content -Path $FilePath
    $count = $lines.Count

    if ($count -le $MaxLines) {
        return ($lines -join "`n")
    }

    $head = $lines[0..179] -join "`n"
    $tail = $lines[($count - 70)..($count - 1)] -join "`n"
    return "$head`n... TRUNCATED ($count lines total) ...`n$tail"
}

function Build-FileContext {
    param(
        [string[]]$TargetFiles,
        [string]$BasePath
    )

    if (-not $TargetFiles -or $TargetFiles.Count -eq 0) {
        return "No file context provided."
    }

    $sections = New-Object System.Collections.Generic.List[string]
    foreach ($file in $TargetFiles) {
        $fullPath = if ([System.IO.Path]::IsPathRooted($file)) { $file } else { Join-Path $BasePath $file }
        $content = Get-TrimmedFileContext -FilePath $fullPath
        $sections.Add("### FILE: $file`n$content")
    }

    return ($sections -join "`n`n")
}

function Clean-Text {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Text
    )

    # Remove ANSI escape sequences if any.
    return [System.Text.RegularExpressions.Regex]::Replace($Text, "\x1B\[[0-9;?]*[ -/]*[@-~]", "").Trim()
}

$promptDir = Join-Path $PSScriptRoot "prompts"
$fileContext = Build-FileContext -TargetFiles $Files -BasePath $RepoPath

if ($Mode -eq "custom") {
    $prompt = @"
$Task

Repository:
$RepoPath

Relevant file context:
$fileContext
"@
} else {
    $templatePath = Join-Path $promptDir "$Mode.txt"
    if (-not (Test-Path $templatePath)) {
        throw "No existe plantilla para modo '$Mode': $templatePath"
    }

    $template = Get-Content -Path $templatePath -Raw
    $prompt = $template.Replace("{{TASK}}", $Task).Replace("{{REPO_PATH}}", $RepoPath).Replace("{{FILE_CONTEXT}}", $fileContext)
}

Write-Host "Model: $Model"
Write-Host "Mode : $Mode"
Write-Host "Repo : $RepoPath"
if ($Files.Count -gt 0) {
    Write-Host "Files: $($Files -join ', ')"
}
Write-Host ""

try {
    $null = Invoke-RestMethod -Method Get -Uri "$OllamaBaseUrl/api/tags" -TimeoutSec 5
} catch {
    throw "Ollama no responde en $OllamaBaseUrl. Inicia Ollama y reintenta."
}

$payload = @{
    model  = $Model
    prompt = $prompt
    stream = $false
}

try {
    $response = Invoke-RestMethod -Method Post -Uri "$OllamaBaseUrl/api/generate" -ContentType "application/json" -Body ($payload | ConvertTo-Json -Depth 8) -TimeoutSec 600
} catch {
    throw "Error llamando /api/generate: $($_.Exception.Message)"
}

if (-not $response) {
    throw "Respuesta vacia desde Ollama."
}

if ($response.PSObject.Properties['error'] -and $response.error) {
    throw "Ollama devolvio error: $($response.error)"
}

$result = Clean-Text -Text ([string]$response.response)
if ([string]::IsNullOrWhiteSpace($result)) {
    throw "Ollama devolvio texto vacio."
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
    $result
} else {
    $parent = Split-Path -Parent $OutputFile
    if ($parent -and -not (Test-Path $parent)) {
        New-Item -Path $parent -ItemType Directory -Force | Out-Null
    }

    Set-Content -Path $OutputFile -Value $result -Encoding UTF8
    Write-Host "Output guardado en: $OutputFile"
}
