#!/bin/bash

# SollyCoin Server Starter
# ALTIJD EN ALLEEN POORT 5500 GEBRUIKEN

echo "🚀 SollyCoin Server Starter"
echo "📡 Poort: 5500"
echo "🌐 URL: http://127.0.0.1:5500"

# Kill bestaande processen op poort 5500
echo "🧹 Cleanup oude processen..."
lsof -ti:5500 | xargs kill -9 2>/dev/null || true

# Start server op poort 5500
echo "🔥 Start server op poort 5500..."
python3 -m http.server 5500

echo "✅ Server gestart op http://127.0.0.1:5500" 