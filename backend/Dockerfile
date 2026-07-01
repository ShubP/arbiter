# Arbiter backend — FastAPI negotiation service (deployed on Alibaba Cloud ECS).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Install dependencies first for better layer caching.
COPY pyproject.toml ./
COPY src ./src
RUN pip install --upgrade pip && pip install .

EXPOSE 8000

# Bind to all interfaces so the container is reachable on the ECS instance.
CMD ["sh", "-c", "uvicorn arbiter.api:app --host 0.0.0.0 --port ${PORT}"]
