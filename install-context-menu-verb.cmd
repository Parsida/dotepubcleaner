@echo off

:: Get script directory
set "repo=%~dp0"
:: Slice off last \
set "repo=%repo:~0,-1%"
choice /m "Set context menu verb to run from %repo% ?"
if %errorlevel% neq 2 goto add
goto :EOF

:add
:: Create keys
reg add HKCR\epub_auto_file\shell\Clean\command /f >nul
:: Set name Clean
reg add HKCR\epub_auto_file\shell\Clean /ve /d Clean /f >nul
:: Set icon that looks like a document with indents and sidebar
reg add HKCR\epub_auto_file\shell\Clean /v Icon /d "shell32.dll,-16756" /f >nul
:: Set command. Assumes node.exe is on PATH
reg add HKCR\epub_auto_file\shell\Clean\command /ve /d "cmd /c node \"%repo%\" \"^%%1\"" /f
