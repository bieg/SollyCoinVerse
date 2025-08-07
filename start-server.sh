#!/bin/bash

# SollyCoin Server Starter
# ALTIJD EN ALLEEN POORT 5500 GEBRUIKEN

echo "🚀 SollyCoin Server Starter"

# Laad .env indien aanwezig
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

PORT=${PORT:-5500}
HOST=${HOST:-127.0.0.1}

echo "📡 Poort: $PORT"
echo "🌐 URL: http://$HOST:$PORT"

# Kill bestaande processen op poort 5500
echo "🧹 Cleanup oude processen..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

# Start server op poort 5500
echo "🔥 Start server op poort 5500..."
python3 -m http.server $PORT

echo "✅ Server gestart op http://$HOST:$PORT" 