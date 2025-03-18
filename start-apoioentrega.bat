@echo off
echo ===================================================
echo     INICIANDO PROJETO APOIO ENTREGA EM DOCKER
echo ===================================================
echo.

REM Verificar se o Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Docker nao encontrado. Por favor, instale o Docker primeiro.
    echo.
    echo Download: https://www.docker.com/products/docker-desktop
    goto :end
)

REM Verificar se o Docker Compose está instalado
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Docker Compose nao encontrado. Por favor, instale o Docker Compose primeiro.
    goto :end
)

echo Construindo e inicializando os containers...
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Houve um problema ao iniciar os containers.
    goto :end
)

echo.
echo ===================================================
echo APOIO ENTREGA INICIADO COM SUCESSO!
echo.
echo * Acesse o site: http://localhost:8080
echo * Painel Admin: http://localhost:8080/admin.html
echo.
echo Para parar o servidor:
echo   docker-compose down
echo ===================================================
echo.

:end
pause 