#!/usr/bin/env bash
echo "🌐 Starting GetSentimate Backend on Render..."

PORT=${PORT:-8000}
WORKERS=${GUNICORN_WORKERS:-3}

# Use python -m gunicorn to avoid PATH issues
exec python3 -m gunicorn core.wsgi:application \
  --bind 0.0.0.0:${PORT} \
  --workers ${WORKERS} \
  --worker-class sync \
  --timeout 120 \
  --log-level info \
  --access-logfile '-' \
  --error-logfile '-'
