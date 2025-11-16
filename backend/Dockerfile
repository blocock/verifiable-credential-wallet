FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src ./src

# Build the application
RUN npm run build

# Remove dev dependencies and reinstall only production dependencies
RUN npm prune --production

# Create keys directory (will be used for key persistence)
RUN mkdir -p /app/keys

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]

