import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // API_PORT comes from .env (docs/deployment.md); PORT is set by some hosts such as Render.
  await app.listen(process.env.API_PORT ?? process.env.PORT ?? 3001);
}
await bootstrap();
