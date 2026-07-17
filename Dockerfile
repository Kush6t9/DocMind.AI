FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY frontend/ ./

# Build the Vite application and esbuild the server
RUN npm run build

# Expose the monolithic server port
EXPOSE 3000

# Set production environment variable
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "start"]
