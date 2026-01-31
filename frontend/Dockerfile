# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build args for Vite (baked into JS bundle at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default backend URL (can be overridden at runtime)
ENV BACKEND_URL=http://backend:3001

# Cloud Run sets PORT dynamically, default to 8080 for local testing
ENV PORT=8080

EXPOSE 8080

# nginx:alpine automatically runs envsubst on /etc/nginx/templates/*.template
# and outputs to /etc/nginx/conf.d/
CMD ["nginx", "-g", "daemon off;"]
