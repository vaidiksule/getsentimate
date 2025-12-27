#!/usr/bin/env bash
# Render Build Script for GetSentimate Backend
set -o errexit

echo "🚀 Starting GetSentimate Backend Build on Render..."

# Upgrade pip and install dependencies
echo "📦 Installing Python dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# No SQL migrations needed for MongoDB project
# Skipping python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build completed successfully!"
