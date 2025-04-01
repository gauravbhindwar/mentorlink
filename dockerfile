# Use Node.js LTS (Long Term Support) as base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install dependencies with legacy peer deps to handle React version conflicts
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy .env.production first (before copying all files)
COPY .env.production ./.env.production

# Copy all other files
COPY . .

# Set environment variables to disable ESLint during build
ENV NODE_ENV=production
ENV NEXT_DISABLE_ESLINT=1
ENV DISABLE_ESLINT_PLUGIN=true

# Build the Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.production ./.env.production

# Set the correct permission for prerendered pages
RUN mkdir -p .next/static

# Copy the built Next.js application
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js

# Copy node modules and package.json for standalone mode
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Switch to non-root user
USER nextjs

# Expose the listening port
EXPOSE 3000

ENV PORT=3000

# Start the application
CMD ["npm", "start"]
