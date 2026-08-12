<#
웹 포트폴리오 루프 러너 — 헤드리스 새 세션(claude -p)을 반복 스폰. 기억은 docs/ 파일 3종이 잇는다.

시작:  pwsh -File loop\loop.ps1                (기본 10회, 회당 20분 제한)
정지:  loop\STOP 파일 생성 → 다음 확인 시점에 멈춤   (예: ni loop\STOP)
예행:  pwsh -File loop\loop.ps1 -DryRun        (claude 호출 없이 사전점검만)

주의:
- Claude 세션 안에서 실행 금지(중첩 호출) — 일반 터미널에서 실행할 것.
- 🔴 이 레포는 main에 push하면 39초 뒤 실사이트 발행. 루프는 loop-v23 브랜치에 가두고 push를 차단한다.
- 스크린샷에 네트워크 필요(CDN 폰트·Lenis) — 오프라인이면 판정이 왜곡된다.
#>
param(
    [int]$MaxIterations = 10,
    [int]$TimeoutMin = 20,
    [switch]$DryRun,
    [switch]$AllowDirty
)
$ErrorActionPreference = 'Stop'
$LoopDir    = $PSScriptRoot
$Root       = Split-Path $LoopDir -Parent            # D:\Github\henry-portfolio
$LogDir     = Join-Path $LoopDir 'logs'              # gitignore 처리됨
$StopFile   = Join-Path $LoopDir 'STOP'
$PromptFile = Join-Path $LoopDir 'ITERATION_PROMPT.md'
$DenyFile   = Join-Path $LoopDir 'deny-settings.json'
New-Item -ItemType Directory -Force $LogDir | Out-Null

# claude.exe 직접 호출 — .cmd 심(shim)은 여러 줄 인자를 첫 개행에서 절단하므로 금지
$Claude = @(
    (Join-Path $env:USERPROFILE '.local\bin\claude.exe'),
    (Join-Path $env:APPDATA 'npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe')
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Claude) { $Claude = (Get-Command claude.exe -ErrorAction SilentlyContinue).Source }
if (-not $Claude)                 { throw "claude.exe를 찾지 못함(.cmd 심은 금지)" }
if (-not (Test-Path $PromptFile)) { throw "지시서 없음: $PromptFile" }
if (-not (Test-Path $DenyFile))   { throw "차단 설정 없음: $DenyFile" }

function Write-LoopLog([hashtable]$rec) {
    $rec.ts = (Get-Date).ToString('s')
    ($rec | ConvertTo-Json -Compress) | Add-Content (Join-Path $LogDir 'loop.jsonl')
}

# 사전점검 ① 브랜치 가두기 — main이면 loop-v23로 전환(없으면 생성)
$branch = git -C $Root branch --show-current
if ($branch -eq 'main') {
    git -C $Root switch loop-v23 2>$null
    if ($LASTEXITCODE -ne 0) { git -C $Root switch -c loop-v23 | Out-Null }
    Write-Host "브랜치 loop-v23로 전환(발행 경로 main에서 격리)"
}
# 사전점검 ② 미커밋 변경
$dirty = git -C $Root status --porcelain 2>$null
if ($dirty -and -not $AllowDirty) {
    throw "미커밋 변경 있음(사람 작업 중일 수 있음). 정리 후 재시작하거나 -AllowDirty:`n$($dirty -join "`n")"
}

$env:JARVIS_WORKER = '1'        # session-start 훅 announce 생략(워커 관례)
$consecFail = 0
Write-LoopLog @{event='loop_start'; max=$MaxIterations; dry=[bool]$DryRun}

for ($i = 1; $i -le $MaxIterations; $i++) {
    if (Test-Path $StopFile) { Write-Host "STOP 감지 — 종료"; Write-LoopLog @{event='stop_file'; iter=$i}; break }

    $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
    if ($DryRun) { Write-Host "[예행] iter $i — claude 호출 생략"; Write-LoopLog @{event='dry_run'; iter=$i}; continue }

    $outLog = Join-Path $LogDir "iter$i-$ts.out.log"
    $errLog = Join-Path $LogDir "iter$i-$ts.err.log"
    Write-Host "iter $i 시작 ($ts) — 새 세션(기억 없음)"
    $p = Start-Process -FilePath $Claude `
        -ArgumentList @('-p','--output-format','text','--permission-mode','bypassPermissions','--settings',$DenyFile) `
        -WorkingDirectory $Root `
        -RedirectStandardInput $PromptFile `
        -RedirectStandardOutput $outLog -RedirectStandardError $errLog `
        -NoNewWindow -PassThru

    if (-not $p.WaitForExit($TimeoutMin * 60 * 1000)) {
        taskkill /F /T /PID $p.Id 2>$null | Out-Null
        Write-Host "iter $i 시간 초과($TimeoutMin 분) — 트리 강제 종료"
        Write-LoopLog @{event='timeout'; iter=$i; log=$outLog}
        $consecFail++
    }
    else {
        $tail = (Get-Content $outLog -Tail 40 -ErrorAction SilentlyContinue) -join "`n"
        if ($p.ExitCode -ne 0) { $consecFail++ } else { $consecFail = 0 }
        Write-LoopLog @{event='iter_end'; iter=$i; exit=$p.ExitCode; log=$outLog}
        Write-Host "iter $i 종료 (exit $($p.ExitCode))"
        if ($tail -match 'rate.?limit|usage limit|resets \d') {
            Write-Host "사용량 한도 감지 — 종료(재개는 사람이 판단)"
            Write-LoopLog @{event='rate_limit'; iter=$i; log=$outLog}
            break
        }
    }
    if ($consecFail -ge 2) { Write-Host "연속 실패 2회 — 종료"; Write-LoopLog @{event='consec_fail_stop'; iter=$i}; break }
}
Write-LoopLog @{event='loop_end'}
Write-Host "루프 종료. 로그: $LogDir"
