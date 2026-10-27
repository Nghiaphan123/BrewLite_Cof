import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for web frontend (docs/deployment.md)
  const allowedOrigin = process.env.CORS_ORIGIN ?? process.env.WEB_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: allowedOrigin.includes(',') ? allowedOrigin.split(',').map((o) => o.trim()) : allowedOrigin,
    credentials: true,
  });

  // C1: Base path /api/v1 (ADR 0005)
  app.setGlobalPrefix('api/v1');

  // C3: Standard error envelope filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS: the browser calls this API from another origin (web :3000 -> api :3001).
  // WEB_ORIGIN (apps/api/.env) and CORS_ORIGIN (docker-compose) each take one or
  // more comma-separated origins, e.g. http://localhost:3000 (no trailing slash).
  const allowedOrigins = [process.env.WEB_ORIGIN, process.env.CORS_ORIGIN]
    .flatMap((value) => (value ?? '').split(','))
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length > 0 ? [...new Set(allowedOrigins)] : ['http://localhost:3000'],
  });

  // API_PORT comes from .env (docs/deployment.md); PORT is set by some hosts such as Render.
  await app.listen(process.env.API_PORT ?? process.env.PORT ?? 3001);
}
await bootstrap();
