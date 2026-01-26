FROM node:20-alpine

WORKDIR /app

# Install runtime helpers
RUN apk add --no-cache su-exec

# Copy and install API dependencies first
COPY apps/api/package*.json ./
RUN npm install --omit=dev

# Copy local packages directly into node_modules
COPY packages_temp/db ./node_modules/@pipelineos/db
COPY packages_temp/ai-core ./node_modules/@pipelineos/ai-core

# Install local package dependencies
RUN cd node_modules/@pipelineos/db && npm ci --only=production 2>/dev/null || npm install --only=production
RUN cd node_modules/@pipelineos/ai-core && npm ci --only=production 2>/dev/null || npm install --only=production

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

EXPOSE 8090

ENV NODE_ENV=production
ENV PORT=8090

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "src/server.js"]
