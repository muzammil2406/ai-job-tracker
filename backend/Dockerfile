FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npx nest build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main"]
