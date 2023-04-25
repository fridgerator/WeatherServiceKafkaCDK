FROM node:16-alpine

WORKDIR /app

COPY package.json yarn.lock tsconfig.json /app/
COPY src/ /app/src/

RUN yarn

CMD ["yarn", "go"]
