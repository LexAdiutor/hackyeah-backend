FROM node:18

ENV PORT 3000
ENV CORE_URL https://lexadiutor.pl:8111
ENV JWT_SECRET real_hidden_secret

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]