#!/bin/zsh

set -e

PROJECT_DIR="/Users/akashjaiswal/Desktop/Arogya-AI"
APP_URL="http://localhost:9003"
BACKEND_URL="http://localhost:8081/api/health"

cd "$PROJECT_DIR"

echo "Starting MySQL service..."
brew services start mysql >/dev/null 2>&1 || true

echo "Checking MySQL app user..."
if ! mysql -u arogya_app -parogya123 -e "USE arogya_ai; SELECT 1;" >/dev/null 2>&1; then
  echo ""
  echo "MySQL user/database is not ready."
  echo "Open MySQL Workbench and run:"
  echo ""
  echo "CREATE DATABASE IF NOT EXISTS arogya_ai;"
  echo "CREATE USER IF NOT EXISTS 'arogya_app'@'localhost' IDENTIFIED BY 'arogya123';"
  echo "GRANT ALL PRIVILEGES ON arogya_ai.* TO 'arogya_app'@'localhost';"
  echo "FLUSH PRIVILEGES;"
  echo ""
  read "unused?Press Enter to exit..."
  exit 1
fi

echo "Starting JDBC MySQL backend..."
osascript <<'APPLESCRIPT'
tell application "Terminal"
  do script "cd /Users/akashjaiswal/Desktop/Arogya-AI && npm run jdbc:mysql:local"
end tell
APPLESCRIPT

echo "Waiting for backend..."
for attempt in {1..30}; do
  if curl -s "$BACKEND_URL" | grep -q "jdbc:mysql"; then
    echo "Backend is ready."
    break
  fi
  sleep 1
done

echo "Starting Next.js frontend..."
osascript <<'APPLESCRIPT'
tell application "Terminal"
  do script "cd /Users/akashjaiswal/Desktop/Arogya-AI && npx next dev --turbopack -p 9003"
end tell
APPLESCRIPT

echo "Opening app..."
sleep 3
open "$APP_URL"

echo ""
echo "Arogya AI is starting."
echo "Frontend: http://localhost:9003"
echo "Backend:  http://localhost:8081/api/health"
echo ""
