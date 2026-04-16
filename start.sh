#!/bin/bash
# ─── Sneha ❤️ Aman Wedding App — Startup Script ───────────────

echo ""
echo "  🪔  Sneha ❤️ Aman — Wedding Moments  🪔"
echo "  ══════════════════════════════════════════"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌ Python 3 is required but not installed."
  exit 1
fi

# Create .env from example if missing
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "📋 Created .env from .env.example — please edit it with your credentials!"
    echo ""
  fi
fi

# Install requirements
echo "📦 Installing dependencies…"
pip3 install -r requirements.txt -q

echo ""
echo "✅ Starting Flask server at http://localhost:5000"
echo "   Gallery:  http://localhost:5000"
echo "   Admin:    http://localhost:5000/admin"
echo ""

python3 app.py
