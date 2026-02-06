FROM alpine:latest

# Install dependencies
RUN apk add --no-cache \
    ca-certificates \
    unzip \
    wget

# Download PocketBase
ARG POCKETBASE_VERSION=0.21.0
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip \
    && rm pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip \
    && chmod +x pocketbase

# Create non-root user
RUN addgroup -g 1001 -S pocketbase && \
    adduser -S pocketbase -u 1001 -G pocketbase

# Create data directories
RUN mkdir -p /pb_data /pb_migrations && \
    chown -R pocketbase:pocketbase /pb_data /pb_migrations

USER pocketbase

EXPOSE 8090

CMD ["/pocketbase", "serve", "--http=0.0.0.0:8090"]
