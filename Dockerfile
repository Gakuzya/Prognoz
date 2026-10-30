# =========================================================
# Stage 1: Build Next.js Standalone Bundle
# =========================================================
FROM node:20-bookworm-slim AS next-builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# =========================================================
# Stage 2: Build Python ML Environment (FastAPI MMM)
# =========================================================
FROM python:3.11-slim AS python-builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY ai-engine/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# =========================================================
# Stage 3: Unified Production Runner (Render & Linux Server)
# =========================================================
FROM python:3.11-slim AS runner
WORKDIR /app

# Install Node.js 20 runtime, curl (for health checks), and OpenSSL (for Prisma)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    openssl \
    bash \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy Python virtual environment & microservice code
COPY --from=python-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY ai-engine ./ai-engine

# Copy Next.js standalone server and static assets
COPY --from=next-builder /app/.next/standalone ./
COPY --from=next-builder /app/.next/static ./.next/static
COPY --from=next-builder /app/public ./public
COPY --from=next-builder /app/prisma ./prisma
COPY --from=next-builder /app/package.json ./package.json

# Copy and prepare entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Environment settings
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV AI_ENGINE_URL="http://127.0.0.1:8000"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Render provides dynamic PORT (typically 10000), Linux server uses 3000
EXPOSE 3000 10000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
