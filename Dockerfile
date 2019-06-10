FROM node:lts

WORKDIR /app
COPY . .
RUN npm install --production

ENTRYPOINT ["npm", "run", "start"]
