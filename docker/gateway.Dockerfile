FROM node:20-alpine

WORKDIR /app

# Copy package manifests and install production dependencies
COPY gateway/package*.json ./
RUN npm ci --only=production

# Copy gateway source code
COPY gateway/server.js ./

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8081/health || exit 1

CMD ["node", "server.js"]
