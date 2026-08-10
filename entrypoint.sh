#!/bin/sh
set -e

echo "🚀 WhatToCook Backend Initializing..."

# Run database migrations
echo "📦 Applying database migrations..."
python manage.py migrate --noinput

# Automatically seed catalog recipes and ingredients
echo "🍳 Automatically seeding ingredients catalog and gourmet recipes..."
python manage.py seed_recipes || echo "⚠️ Seed warning (already seeded or non-fatal)"

echo "✨ Backend initialization complete. Starting server..."
exec python manage.py runserver 0.0.0.0:8000
