FROM node:18-alpine

# Install sharp dependencies for Alpine Linux
RUN apk add --no-cache \
    libc6-compat \
    vips-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code and frontend files
COPY src/ ./src/
COPY public/ ./public/
COPY tsconfig.json ./

# Build backend
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV DB_PATH=/app/data/inventory.db

# Start the application
CMD ["npm", "start"]