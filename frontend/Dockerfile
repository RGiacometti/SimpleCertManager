# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_URL
ARG VITE_POCKETBASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL

# Build the application (increase memory for multi-platform builds)
ENV NODE_OPTIONS=--max_old_space_size=4096
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
