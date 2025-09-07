FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY *.js ./

# Expose port
EXPOSE 8080

# Start the service
CMD ["node", "microsoft-stytch-backend.js"]
