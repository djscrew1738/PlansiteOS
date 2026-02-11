FROM node:20-alpine

WORKDIR /app

# Install runtime helpers
RUN apk add --no-cache su-exec

# Copy local packages where file: deps resolve from /app
COPY packages_temp/db /packages_temp/db
COPY packages_temp/ai-core /packages_temp/ai-core

# Copy and install API dependencies first
COPY apps/api/package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY apps/api/src ./src

# Create non-root user and directories
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p uploads/blueprints && \
    chown -R nodejs:nodejs /app

# Entrypoint handles volume ownership and drops privileges
COPY apps/api/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER root

EXPOSE 5001

ENV NODE_ENV=production
ENV PORT=5001

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "src/server.js"]
