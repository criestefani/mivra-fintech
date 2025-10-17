@echo off
REM Script para adicionar Redis ao PATH no Windows
REM Duplo-clique para executar

echo.
echo ====================================================
echo    Adicionar Redis ao PATH - Windows
echo ====================================================
echo.

REM Verificar permissões de admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo [ERRO] Este script precisa ser executado como ADMINISTRADOR!
    echo.
    echo Para executar como admin:
    echo   1. Clique com botao direito neste arquivo
    echo   2. Escolha "Executar como administrador"
    echo.
    pause
    exit /b 1
)

REM Executar o PowerShell script
echo Iniciando processo de configuracao...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0add-redis-to-path.ps1"

if %errorLevel% equ 0 (
    echo.
    echo [SUCESSO] Redis adicionado ao PATH!
    echo.
) else (
    echo.
    echo [ERRO] Falha ao adicionar Redis ao PATH
    echo.
)

pause
