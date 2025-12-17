# ===========================================
# Toddler Schedule App - Docker Configuration
# ===========================================

FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY server.js ./
COPY api-client.js ./

# Copy frontend files
COPY public ./public

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set environment variables
ENV PORT=3001
ENV DB_PATH=/app/data/toddler-schedule.db

# Expose port
EXPOSE 3001

# Health check (using Node.js since wget isn't in alpine, using 127.0.0.1 to avoid IPv6 issues)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3001/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the server
CMD ["node", "server.js"]
