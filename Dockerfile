FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx vite build

EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "server/index.js"]
