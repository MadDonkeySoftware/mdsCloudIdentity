FROM node:22 as builder

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

###########################
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY ./config/default.js ./config/default.js
RUN npm install --only=prod

COPY --from=builder /usr/src/app/dist .
EXPOSE 8888

CMD [ "node", "./server.js" ]
# To ship logs to the ELK stack extend the above command
# node ./bin/server | pino-socket -a 127.0.0.2 -p 6000 -m tcp
# https://github.com/pinojs/pino/blob/master/docs/transports.md#logstash