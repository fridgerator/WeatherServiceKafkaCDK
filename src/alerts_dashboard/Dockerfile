FROM node:16-alpine

WORKDIR /app

COPY package.json yarn.lock /app/
COPY dist/ /app/dist/
COPY src/ /app/src/

RUN yarn

EXPOSE 8080

CMD ["node", "src/server/index.js"]
