FROM node:8-alpine

ENV RELEASE_VERSION=1.0.4 \
    SHELL=/bin/bash

RUN \
  apk add --update bash g++ make curl && \
  curl -o /tmp/stress-${RELEASE_VERSION}.tgz https://fossies.org/linux/privat/stress-${RELEASE_VERSION}.tar.gz && \
  cd /tmp && tar xvf stress-${RELEASE_VERSION}.tgz && rm /tmp/stress-${RELEASE_VERSION}.tgz && \
  cd /tmp/stress-${RELEASE_VERSION} && \
  ./configure && make -j$(getconf _NPROCESSORS_ONLN) && make install && \
  apk del g++ make curl && \
  rm -rf /tmp/* /var/tmp/* /var/cache/apk/* /var/cache/distfiles/*


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
