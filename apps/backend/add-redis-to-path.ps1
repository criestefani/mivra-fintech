# Script para adicionar Redis ao PATH automaticamente no Windows
# Executar como ADMINISTRADOR

Write-Host "🔍 Procurando por Redis..." -ForegroundColor Cyan
Write-Host ""

# Procurar por redis-server.exe em locais comuns
$possiblePaths = @(
    "C:\redis",
    "C:\Program Files\redis",
    "C:\Program Files (x86)\redis",
    "$env:ProgramFiles\redis",
    "$env:LOCALAPPDATA\redis",
    "C:\Users\$env:USERNAME\redis",
    "C:\msys64\mingw64\bin",
    "D:\redis",
    "E:\redis"
)

$redisPath = $null

# Procurar redis-server.exe
foreach ($path in $possiblePaths) {
    if (Test-Path "$path\redis-server.exe") {
        $redisPath = $path
        Write-Host "✅ Redis encontrado em: $path" -ForegroundColor Green
        break
    }
}

# Se não encontrou em locais comuns, procurar recursivamente (mais lento)
if ($null -eq $redisPath) {
    Write-Host "⏳ Procurando em todo o disco C:\ (isso pode levar um tempo)..." -ForegroundColor Yellow

    try {
        $search = Get-ChildItem -Path "C:\" -Filter "redis-server.exe" -Recurse -ErrorAction SilentlyContinue -Force | Select-Object -First 1
        if ($search) {
            $redisPath = Split-Path $search.FullName
            Write-Host "✅ Redis encontrado em: $redisPath" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️ Erro ao procurar em C:\" -ForegroundColor Yellow
    }
}

if ($null -eq $redisPath) {
    Write-Host ""
    Write-Host "❌ Redis não foi encontrado no computador" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Por favor:" -ForegroundColor Yellow
    Write-Host "   1. Baixe Redis: https://github.com/microsoftarchive/redis/releases" -ForegroundColor Yellow
    Write-Host "   2. Extraia em uma pasta (ex: C:\redis)" -ForegroundColor Yellow
    Write-Host "   3. Execute este script novamente" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host ""
Write-Host "🔧 Adicionando ao PATH..." -ForegroundColor Cyan

# Obter PATH atual
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Verificar se já está no PATH
if ($currentPath -like "*$redisPath*") {
    Write-Host "✅ Redis já está no PATH!" -ForegroundColor Green
} else {
    # Adicionar ao PATH
    $newPath = "$currentPath;$redisPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✅ Redis adicionado ao PATH!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔄 Testando Redis..." -ForegroundColor Cyan

# Atualizar PATH do processo atual
$env:Path = [Environment]::GetEnvironmentVariable("Path", "User")

# Testar redis-server
try {
    $version = & redis-server --version 2>&1
    Write-Host "✅ Redis está acessível!" -ForegroundColor Green
    Write-Host "   $version" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Redis não está acessível do terminal atual" -ForegroundColor Yellow
    Write-Host "   Feche e abra um novo PowerShell/CMD" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Próximas etapas:" -ForegroundColor Cyan
Write-Host "   1. Feche este PowerShell" -ForegroundColor Cyan
Write-Host "   2. Abra um NOVO PowerShell" -ForegroundColor Cyan
Write-Host "   3. Execute: npm run check:redis" -ForegroundColor Cyan
Write-Host "   4. Execute: npm run pm2:start" -ForegroundColor Cyan
Write-Host ""

Read-Host "Pressione Enter para sair"
