#!/usr/bin/env bash
# Render Start Script for GetSentimate Backend

echo "🌐 Starting GetSentimate Backend on Render..."

# Start Gunicorn server
exec gunicorn --config gunicorn.conf.py core.wsgi:application
