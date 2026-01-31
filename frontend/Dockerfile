# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

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

EXPOSE 80

# nginx:alpine automatically runs envsubst on /etc/nginx/templates/*.template
# and outputs to /etc/nginx/conf.d/
CMD ["nginx", "-g", "daemon off;"]
