FROM node:24

WORKDIR /app

COPY package.json .
COPY server.js .
COPY index.html .

RUN yarn install --frozen-lockfile

EXPOSE 8080

CMD [ "node", "server.js" ]
