FROM node:current-alpine


RUN mkdir /app
WORKDIR /app

COPY app.js . 
COPY LICENSE .
COPY package.json .
COPY README.md .
COPY views ./views
COPY public ./public

RUN npm install \
    && npm audit fix 

EXPOSE 3000

CMD ["node", "app.js"]
