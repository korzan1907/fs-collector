FROM mhart/alpine-node:11

CMD mkdir /collector
WORKDIR /collector

COPY server.js .
COPY teams.json .
COPY config.json .
COPY LICENSE .
COPY package.json .
COPY package-lock.json .
COPY README.md .
COPY LICENSE .
COPY lib ./lib
COPY public ./public
COPY language ./language
COPY mdimages ./mdimages
COPY insight ./insight

RUN npm install

EXPOSE 3000

CMD ["node", "server.js"]
