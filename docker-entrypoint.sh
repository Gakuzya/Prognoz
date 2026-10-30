#!/bin/bash
set -e

echo "🚀 [AdForecast] Starting AI Engine (Python FastAPI MMM) on 127.0.0.1:8000..."
cd /app/ai-engine
python -m uvicorn main:app --host 127.0.0.1 --port 8000 &
PYTHON_PID=$!

cd /app

echo "⏳ [AdForecast] Waiting for Python AI Engine to be healthy..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then
    echo "✅ [AdForecast] Python AI Engine is online and ready!"
    break
  fi
  sleep 1
done

# Если передан DATABASE_URL, проверяем синхронизацию схемы с Supabase
if [ -n "$DATABASE_URL" ]; then
  echo "📦 [AdForecast] Syncing Prisma schema with database..."
  npx prisma db push --skip-generate || echo "⚠️ [AdForecast] Prisma push skipped or non-fatal error, proceeding to launch..."
fi

# Render динамически назначает PORT (по умолчанию 10000, на VPS 3000)
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"

echo "🌟 [AdForecast] Launching Next.js on 0.0.0.0:$PORT..."
exec node server.js
