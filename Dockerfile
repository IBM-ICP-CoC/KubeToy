FROM node:9-alpine


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
    && apk del build-dependencies

# RUN apk add --no-cache --virtual .gyp \
#         python \
#         make \
#         g++ \
#     && npm install \
#         body-parser ejs express net-ping sprintf-js valid-filename node-uname ibm-cos-sdk formidable\
#     && apk del .gyp

# RUN npm install

EXPOSE 3000

CMD ["node", "app.js"]
