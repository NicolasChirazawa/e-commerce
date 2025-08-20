FROM node:lts-alpine3.22
WORKDIR /app
COPY package* .
RUN npm install
COPY . .
EXPOSE 3000
EXPOSE 6379
CMD ["npm", "start"]