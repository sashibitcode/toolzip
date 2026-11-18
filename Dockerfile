# ==========================================
# TOOLZIP Production Multi-Tool Dockerfile
# Bundles Node.js, LibreOffice, Ghostscript, Poppler, and Chromium
# ==========================================

FROM node:20-bookworm-slim

# Avoid interactive prompts during apt install
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install system conversion tools & fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    ghostscript \
    poppler-utils \
    chromium \
    fonts-liberation \
    fonts-dejavu \
    fonts-freefont-ttf \
    ca-certificates \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first for caching
COPY package.json package-lock.json* ./

# Install all dependencies for build
RUN npm ci

# Copy the rest of the application source
COPY . .

# Build Next.js production bundle
RUN npm run build

# Remove development dependencies to keep image lean
RUN npm prune --production

# Create storage directory for isolated jobs
RUN mkdir -p /app/storage/jobs

EXPOSE 3000

# Start production server
CMD ["npm", "start"]
