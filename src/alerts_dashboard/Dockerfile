FROM node:18-alpine

WORKDIR /app

COPY package.json yarn.lock webpack.config.js .babelrc /app/
COPY src/ /app/src/
COPY public/ /app/public/
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN yarn && \
  yarn build

EXPOSE 8080

CMD ["node", "src/server/index.js"]
