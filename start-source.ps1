param(
    [ValidateSet('Start', 'Stop', 'Status')]
    [string]$Action = 'Start'
)

$ErrorActionPreference = 'Stop'
$platformDirectory = Join-Path $PSScriptRoot 'autogpt_platform'
$middlewareServices = @('db', 'redis-0', 'redis-1', 'redis-2', 'redis-init', 'rabbitmq', 'falkordb', 'clamav')
$linuxRuntimeDirectory = '/mnt/e/work/AutoGPT/.local-runtime'

function Wait-SourceEndpoint {
    param([string]$Uri, [int]$TimeoutSeconds)
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "Ready: $Uri (HTTP 200)"
                return
            }
        }
        catch {}
        Start-Sleep -Seconds 5
    } while ((Get-Date) -lt $deadline)
    throw "Readiness check timed out: $Uri. Check .local-runtime\logs."
}

Push-Location $platformDirectory
try {
    switch ($Action) {
        'Start' {
            docker compose up -d --no-build @middlewareServices
            if ($LASTEXITCODE -ne 0) { throw 'Middleware startup failed.' }
            wsl -d AutoGPT-Ubuntu -u root -- bash "$linuxRuntimeDirectory/prepare-wsl.sh"
            if ($LASTEXITCODE -ne 0) { throw 'WSL preparation failed.' }
            foreach ($service in @('backend', 'frontend')) {
                $pidFile = Join-Path $PSScriptRoot ".local-runtime\$service.pid"
                if (Test-Path -LiteralPath $pidFile) {
                    $previousProcessId = [int](Get-Content -LiteralPath $pidFile)
                    $previousProcess = Get-Process -Id $previousProcessId -ErrorAction SilentlyContinue
                    if ($previousProcess -and $previousProcess.ProcessName -eq 'wsl') {
                        Write-Host "$service already running (WSL host PID $previousProcessId)"
                        continue
                    }
                }
                $serviceProcess = Start-Process -FilePath 'wsl.exe' -ArgumentList "-d AutoGPT-Ubuntu -u autogpt -- bash $linuxRuntimeDirectory/run-$service-wsl.sh" -WorkingDirectory $PSScriptRoot -RedirectStandardOutput "$PSScriptRoot\.local-runtime\logs\$service.stdout.log" -RedirectStandardError "$PSScriptRoot\.local-runtime\logs\$service.stderr.log" -WindowStyle Hidden -PassThru
                $serviceProcess.Id | Set-Content -LiteralPath $pidFile
                Write-Host "$service started (WSL host PID $($serviceProcess.Id))"
            }
            Write-Host 'Waiting for the source services to become ready...'
            Wait-SourceEndpoint -Uri 'http://localhost:8006/health' -TimeoutSeconds 600
            Wait-SourceEndpoint -Uri 'http://localhost:3000/login' -TimeoutSeconds 120
            Write-Host 'Frontend: http://localhost:3000/login'
            Write-Host 'Backend:  http://localhost:8006/docs'
            Write-Host "Logs:     $PSScriptRoot\.local-runtime\logs"
        }
        'Stop' {
            wsl --terminate AutoGPT-Ubuntu
            if ($LASTEXITCODE -ne 0) { throw 'WSL shutdown failed.' }
            docker compose stop @middlewareServices
            if ($LASTEXITCODE -ne 0) { throw 'Middleware shutdown failed.' }
        }
        'Status' {
            wsl -d AutoGPT-Ubuntu -u autogpt -- ps -u autogpt -o pid,pcpu,rss,args
            docker compose ps -a
        }
    }
}
finally {
    Pop-Location
}
