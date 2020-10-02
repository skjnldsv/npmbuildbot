FROM node:lts

# Copy app
WORKDIR /app
COPY . .

# Confirm installation of node
RUN node -v
RUN npm -v

# Install deps
RUN npm install --production

ENTRYPOINT ["npm", "run", "start"]
