$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
if (!(Test-Path '.env')) { throw 'Missing private render-worker/.env. Configure locally; never share the keys.' }
foreach ($line in Get-Content -LiteralPath '.env') {
 if ($line -match '^([A-Z_]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1],$matches[2],'Process') }
}
node worker.mjs
if ($LASTEXITCODE -ne 0) { throw 'DOMUS worker stopped. Read the local log before restarting; failed jobs are not retried.' }
