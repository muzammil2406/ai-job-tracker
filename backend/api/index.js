// Vercel serverless entry point for the NestJS app.
// Boots the Nest application once, then delegates every request
// (REST + GraphQL) to the Express adapter.
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('../dist/app.module');
const express = require('express');
const passport = require('passport');

const server = express();
server.disable('x-powered-by');
// Passport strategies (JWT) require the initialize middleware to attach
// req.logIn/req.logOut to incoming requests before guards run.
server.use(passport.initialize());

let appPromise = null;

async function createApp() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['log', 'error', 'warn'],
  });

  const allowedOrigins = ['http://localhost:3000'];
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();
  return app;
}

module.exports = async function handler(req, res) {
  if (!appPromise) {
    appPromise = createApp().catch((err) => {
      appPromise = null;
      throw err;
    });
  }
  await appPromise;
  server.handle(req, res);
};