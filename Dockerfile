# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./
COPY src/ ./src/
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src/ ./src/
RUN npx tsc

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app

# Install production server deps only
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev

# Copy built server
COPY --from=server-build /app/server/dist ./server/dist
COPY server/migrations ./server/migrations

# Copy built frontend
COPY --from=frontend-build /app/dist ./public

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server/dist/index.js"]
