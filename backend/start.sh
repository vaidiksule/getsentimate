#!/usr/bin/env bash
echo "🌐 Starting GetSentimate Backend on Render..."

PORT=${PORT:-8000}
WORKERS=${GUNICORN_WORKERS:-3}

# Use python -m gunicorn to avoid PATH issues
# Increased timeout to 600s because 500-comment analysis can take a while
exec python3 -m gunicorn core.wsgi:application \
  --bind 0.0.0.0:${PORT} \
  --workers ${WORKERS} \
  --worker-class sync \
  --timeout 600 \
  --log-level info \
  --access-logfile '-' \
  --error-logfile '-'
