@echo off
echo Iniciando dependencias (npm install en root)...
call npm install

echo Iniciando Backend (Puerto 3000)...
start cmd /k "cd whatsapp-backend && npm run dev"

echo Iniciando Dashboard (Puerto 3001)...
start cmd /k "cd whatsapp-dashboard && npm run dev"

echo ========================================================
echo Los servicios se estan iniciando en nuevas ventanas.
echo Backend: http://localhost:3000
echo Dashboard: http://localhost:3001
echo Nota: Si no tienes PostgreSQL local instalado,
echo el backend iniciara automaticamente en MODO MEMORIA.
echo ========================================================
