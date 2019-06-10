FROM node:lts-slim

WORKDIR /app
COPY . .
RUN npm install --production

ENTRYPOINT ["npm", "run", "start"]
