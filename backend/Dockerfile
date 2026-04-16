FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY app/ ./app/

# Data will be downloaded on first startup if not mounted
RUN mkdir -p /app/data

EXPOSE 8000

# Use PORT env var if provided (Railway/Heroku convention), else 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
