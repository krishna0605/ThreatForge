FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libmagic1 curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# App code
COPY . .
RUN mkdir -p /tmp/uploads && chown -R appuser:appgroup /tmp/uploads /app

USER appuser

EXPOSE ${PORT:-5000}

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-5000}/api/health || exit 1

# Shell form so $PORT expands at runtime (Render assigns PORT dynamically)
CMD gunicorn run:app \
     --worker-class gevent \
     --workers 4 \
     --bind 0.0.0.0:${PORT:-5000} \
     --timeout 120 \
     --access-logfile - \
     --error-logfile -
