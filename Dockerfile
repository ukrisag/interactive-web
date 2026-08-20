# ==============================================================================
# Multi-stage Dockerfile for King Prajadhipok's Institute Cloud Deployment
# 100% Open Source Architecture (Node 24 Alpine -> Nginx Alpine)
# ==============================================================================

# Stage 1: Build the Angular application
FROM node:24-alpine AS build-stage
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm ci

# Copy full source and build
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Production Nginx Server
FROM nginx:alpine AS production-stage

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled Angular artifacts
COPY --from=build-stage /app/dist/interactive-app/browser /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
