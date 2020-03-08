FROM node:8-alpine

RUN mkdir /app
WORKDIR /app

COPY app.js . 
COPY LICENSE .
COPY package.json .
COPY README.md .
COPY views ./views
COPY public ./public

RUN apk --no-cache --virtual build-dependencies add \
    python \
    make \
    g++ \
    && npm install \
    && npm audit fix \
    && apk del build-dependencies

EXPOSE 3000

CMD ["node", "app.js"]
