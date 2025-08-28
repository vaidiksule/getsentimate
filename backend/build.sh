#!/usr/bin/env bash
# Render Build Script for GetSentimate Backend

echo "🚀 Starting GetSentimate Backend Build on Render..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.production.txt

# Run database migrations
echo "🗄️  Running database migrations..."
python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Build completed successfully!"
