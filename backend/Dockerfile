# ==============================================================================
# Multi-stage Production Dockerfile for Expense Manager Backend (Render)
# ==============================================================================

# ─── Stage 1: Build & Compile TypeScript ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies required for build tools
RUN apk add --no-cache python3 make g++

# Install dependencies based on lockfile for reproducible builds
COPY package*.json tsconfig.json ./
RUN npm ci

# Copy TypeScript source code
COPY index.ts ./
COPY lib/ ./lib/
COPY middleware/ ./middleware/
COPY services/ ./services/

# Compile TypeScript to JavaScript (generates ./build)
RUN npm run build

# Remove development dependencies to keep the image minimal
RUN npm prune --production

# ─── Stage 2: Minimal Production Runtime ──────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Render automatically supplies the PORT environment variable (default: 10000)
# Express reads process.env.PORT, defaulting to 3000 if unset
EXPOSE 3000

# Run container as non-root user for security
USER node

# Copy production dependencies and compiled build from builder
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/build ./build

# Health check endpoint (Express '/' returns 200 "Expense Manager API is running")
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-3000}/ || exit 1

# Start the compiled Express production server
CMD ["node", "build/index.js"]
