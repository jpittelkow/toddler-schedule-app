# ===========================================
# Toddler Schedule App - Docker Configuration
# ===========================================

FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
