# Stage 1: Build the application
FROM node:20-alpine 



WORKDIR /app

# Copy package.json before installing (any changes in 
# depencies will trigger npm install otherwise skip to build and use cache)
COPY package.json ./

# Install NPM packages, including Puppeteer
RUN npm i sharp

# Copy  application code to the container
COPY . .

# Build your application
RUN npm run build

# The command to start your application
CMD ["npm", "start"]