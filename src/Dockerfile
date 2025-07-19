# Use official Node.js runtime as base image
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Compile ParaglideJS messages
RUN npx @inlang/paraglide-js compile --project ./project.inlang

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files for production dependencies
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=base /app/build ./build
COPY --from=base /app/static ./static
COPY --from=base /app/src/paraglide ./src/paraglide
COPY --from=base /app/messages ./messages
COPY --from=base /app/project.inlang ./project.inlang

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S svelte -u 1001

# Change ownership of app directory
RUN chown -R svelte:nodejs /app
USER svelte

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "build"]