FROM mhart/alpine-node

CMD mkdir /drs
WORKDIR /drs

COPY server.js .
COPY LICENSE .
COPY package.json .
COPY README.md .
COPY medData.txt .
COPY lib ./lib
COPY public ./public


RUN npm install

EXPOSE 4200

CMD ["node", "server.js"]
