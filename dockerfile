FROM node:lts-alpine
COPY package.json ./
RUN npm install
RUN mkdir /app && cp -a /tmp/node_modules /app/
COPY . /app/
WORKDIR /app/
EXPOSE 3000
CMD ["npm", "start"]