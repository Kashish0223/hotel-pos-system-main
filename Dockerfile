# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app

# Arguments from Docker Compose
ARG NODE_ENV=production
ARG MONGODB_URI
ARG JWT_SECRET
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL

# Set Envs
ENV NODE_ENV=$NODE_ENV
ENV MONGODB_URI=$MONGODB_URI
ENV JWT_SECRET=$JWT_SECRET
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL

# Copy config files first (Better caching)
COPY package*.json tsconfig.json next.config.mjs ./
RUN npm install --include=dev --legacy-peer-deps

# Copy the rest of the code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Run
FROM node:20-slim
WORKDIR /app

# Only copy what is needed to run
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
