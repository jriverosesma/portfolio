FROM node:18-bullseye
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod -x .husky/pre-commit
EXPOSE 3000
