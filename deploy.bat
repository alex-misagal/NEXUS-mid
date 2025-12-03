@echo off
REM RideKada Docker Deployment Script for Windows
REM Team NEXUS - IT/CS 311

title RideKada Docker Deployment

REM Detect which docker compose command to use
:DETECT_DOCKER
docker compose version >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_CMD=docker compose
    goto MENU
)

docker-compose --version >nul 2>&1
if %errorlevel% equ 0 (
    set DOCKER_CMD=docker-compose
    goto MENU
)

echo ERROR: Docker is not installed or not running!
echo.
echo Please:
echo 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop
echo 2. Start Docker Desktop
echo 3. Run this script again
echo.
pause
exit

:MENU
cls
echo ========================================
echo   RideKada Docker Deployment Script
echo   Team NEXUS - Saint Louis University
echo ========================================
echo.
echo Docker Command: %DOCKER_CMD%
echo.
echo What would you like to do?
echo.
echo 1) Start containers
echo 2) Stop containers
echo 3) Restart containers
echo 4) View logs
echo 5) Show status
echo 6) Remove containers (keep data)
echo 7) Reset everything (remove data)
echo 8) Exit
echo.

set /p choice="Enter your choice [1-8]: "

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto RESTART
if "%choice%"=="4" goto LOGS
if "%choice%"=="5" goto STATUS
if "%choice%"=="6" goto REMOVE
if "%choice%"=="7" goto RESET
if "%choice%"=="8" goto EXIT

echo Invalid option!
pause
goto MENU

:START
echo.
echo Starting RideKada containers...
%DOCKER_CMD% up -d --build
if %errorlevel% equ 0 (
    echo.
    echo Containers started successfully!
    echo.
    echo Access your application at:
    echo   RideKada App: http://localhost:8080
    echo   PHPMyAdmin:   http://localhost:8081
    echo.
    timeout /t 5
    %DOCKER_CMD% ps
) else (
    echo Failed to start containers!
)
pause
goto MENU

:STOP
echo.
echo Stopping RideKada containers...
%DOCKER_CMD% stop
if %errorlevel% equ 0 (
    echo Containers stopped successfully!
) else (
    echo Failed to stop containers!
)
pause
goto MENU

:RESTART
echo.
echo Restarting RideKada containers...
%DOCKER_CMD% restart
if %errorlevel% equ 0 (
    echo Containers restarted successfully!
) else (
    echo Failed to restart containers!
)
pause
goto MENU

:LOGS
echo.
echo Viewing logs (Press Ctrl+C to exit)...
%DOCKER_CMD% logs -f
pause
goto MENU

:STATUS
echo.
echo Container Status:
%DOCKER_CMD% ps
pause
goto MENU

:REMOVE
echo.
echo Removing RideKada containers...
set /p confirm="This will remove all containers. Continue? (y/n): "
if /i "%confirm%"=="y" (
    %DOCKER_CMD% down
    echo Containers removed successfully!
) else (
    echo Operation cancelled
)
pause
goto MENU

:RESET
echo.
echo WARNING: This will remove all containers AND data!
set /p confirm="Are you absolutely sure? (yes/no): "
if /i "%confirm%"=="yes" (
    %DOCKER_CMD% down -v
    echo Everything removed successfully!
) else (
    echo Operation cancelled
)
pause
goto MENU

:EXIT
echo.
echo Goodbye!
timeout /t 2
exit