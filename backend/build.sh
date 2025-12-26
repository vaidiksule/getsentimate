#!/usr/bin/env bash
# Render Build Script for GetSentimate Backend
set -o errexit

echo "🚀 Starting GetSentimate Backend Build on Render..."

# Upgrade pip and install dependencies
echo "📦 Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations (optional for Mongo but keep if standard apps use SQL)
# Using || true to prevent build failure if migrate fails on dummy engine
echo "🗄️  Running database migrations..."
python manage.py migrate || echo "⚠️  Migration skipped or failed (common with MongoDB)"

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build completed successfully!"
