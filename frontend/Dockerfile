# Stage 1: Build the application
FROM node:20-alpine

WORKDIR /app

# Copy package.json (and package-lock.json, if available) before installing dependencies
# This ensures that dependencies will be cached unless there are changes to these files
COPY package.json package-lock.json* ./

# Install NPM packages
# Note: Including Puppeteer as mentioned, but ensure any specific packages like Puppeteer
# are actually used/needed, otherwise, this line installs 'sharp' only
RUN npm install

# Copy the rest of your application code to the container
COPY . .

# Build your application
RUN npm run build

# The command to start your application on port 3333
CMD ["npm", "start", "--", "-p", "3333"]
