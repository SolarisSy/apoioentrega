@echo off
echo ===================================================
echo     PARANDO PROJETO APOIO ENTREGA EM DOCKER
echo ===================================================
echo.

REM Verificar se o Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Docker nao encontrado. Por favor, instale o Docker primeiro.
    goto :end
)

echo Parando os containers...
docker-compose down

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Houve um problema ao parar os containers.
    goto :end
)

echo.
echo ===================================================
echo APOIO ENTREGA PARADO COM SUCESSO!
echo ===================================================
echo.

:end
pause 