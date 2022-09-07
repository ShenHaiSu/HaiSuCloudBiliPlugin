@echo off
:StartCore
node index.js

if %ERRORLEVEL% == 1 goto :StartCore
if %ERRORLEVEL% == 0 exit