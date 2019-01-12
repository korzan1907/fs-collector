FROM mhart/alpine-node

CMD mkdir /collector
WORKDIR /collector

COPY server.js .
COPY LICENSE .
COPY package.json .
COPY README.md .
COPY medData.txt .
COPY lib ./lib
COPY public ./public

RUN npm install

EXPOSE 3000

CMD ["node", "server.js"]
