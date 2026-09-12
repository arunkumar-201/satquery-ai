# SATQUERY AI Frontend Dockerfile
# Multi-stage build: Node build stage -> Nginx serve stage

# ============================================================
# Build Stage
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (including devDependencies for build)
# Note: `npm ci` works only when the lock file matches the exact install
# platform. The committed lock is produced on Windows, so it lists esbuild/
# rollup binaries for every platform; `npm ci` on Linux then fails with
# EBADPLATFORM. Plain `npm install` against the same lock stays deterministic
# (it honors the lock) but installs only the binaries for this platform.
RUN npm install

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# ============================================================
# Serve Stage (Nginx)
# ============================================================
FROM nginx:alpine AS runner

# Copy custom nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Render will provide PORT; locally defaults to 5173
ENV PORT=5173

# Start nginx
CMD ["nginx", "-g", "daemon off;"]