#!/bin/bash

# SollyCoin Server Starter
# ALTIJD EN ALLEEN POORT 5555 GEBRUIKEN

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 SollyCoin Server Starter"
echo "🌐 URL: http://127.0.0.1:5555"
echo "❗ Gebruik GEEN Live Server; deze Node server serveert statics + Socket.IO op poort 5555"

# Kill ALLE processen op poort 5555 (inclusief andere servers)
echo "🧹 Cleanup oude processen op poort 5555..."
lsof -ti:5555 | xargs kill -9 2>/dev/null || true

# Wacht even voor cleanup
sleep 1

# Start Node/Express server op poort 5555 (statisch + Socket.IO)
echo "🔥 Start Node/Express server op poort 5555..."
node server.js
