# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# ARG VITE_SUPABASE_URL
# ARG VITE_SUPABASE_ANON_KEY
# ARG VITE_API_URL


ARG VITE_SUPABASE_URL=https://yjxdijoavgtbjsfujbvv.supabase.co
ARG VITE_SUPABASE_ANON_KEY=sb_publishable_egTiYnheqzTUCjc2VyGTeg_k_c9HCiu
ARG VITE_API_URL=https://ai-spaces-498960626641.australia-southeast1.run.app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

ENV PORT=8080

EXPOSE 8080

CMD ["sh", "-c", "serve -s dist -l $PORT"]
