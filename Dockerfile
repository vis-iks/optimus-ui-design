# syntax=docker/dockerfile:1

# ---- stage 1: build the Angular SPA ----------------------------------------
FROM node:22-bookworm-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production
# output: dist/prime-ng-theme-fe/browser

# ---- stage 2: FastAPI runtime that also serves the SPA ---------------------
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    STATIC_DIR=/app/static \
    DATABASE_URL=sqlite:////data/themes.db

WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=web /app/dist/prime-ng-theme-fe/browser ./static

RUN useradd -m -u 10001 app \
    && mkdir -p /data \
    && chown -R app:app /app /data
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/health').status==200 else 1)"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
