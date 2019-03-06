FROM node:alpine


RUN mkdir /app
WORKDIR /app

COPY app.js . 
COPY LICENSE .
COPY package.json .
COPY README.md .
COPY views ./views
COPY public ./public

RUN apk add --no-cache --virtual .gyp \
        python \
        make \
        g++ \
    && npm install \
        body-parser ejs express net-ping sprintf-js valid-filename node-uname \
    && apk del .gyp

# RUN npm install

EXPOSE 3000

CMD ["node", "app.js"]