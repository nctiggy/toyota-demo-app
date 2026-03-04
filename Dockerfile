FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY server.js ./
ARG APP_VERSION=1.0.0
ENV PORT=3000
ENV APP_VERSION=$APP_VERSION
EXPOSE 3000
CMD ["node", "server.js"]
