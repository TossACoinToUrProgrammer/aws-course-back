#---- Base Node Image ----
FROM node:18-alpine AS base
WORKDIR /app

#---- Dependencies ----
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=development && npm cache clean --force

#---- Copy Files/Build ----
FROM dependencies AS build
WORKDIR /app
COPY . .
# Build frontend bundle static files
RUN npm run build

#---- Release with Alpine ----
FROM node:18-alpine AS release
WORKDIR /app
COPY --from=dependencies /app/package*.json ./
# Install app dependencies
RUN npm ci --only=production && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
CMD [ "npm", "run", "start" ]