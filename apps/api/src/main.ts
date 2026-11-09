import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { LoggingInterceptor } from './common/logging.interceptor.js';
import { requestIdMiddleware } from './common/request-id.middleware.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(requestIdMiddleware);
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // C1: Base path /api/v1 (ADR 0005)
  app.setGlobalPrefix('api/v1');

  // C3: Standard error envelope filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // The browser calls this API from another origin. Accept configured web origins once.
  const allowedOrigins = [process.env.WEB_ORIGIN, process.env.CORS_ORIGIN]
    .flatMap((value) => (value ?? '').split(','))
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins.length > 0 ? [...new Set(allowedOrigins)] : ['http://localhost:3000'],
    credentials: true,
  });

  // API_PORT comes from .env (docs/deployment.md); PORT is set by some hosts such as Render.
  await app.listen(process.env.API_PORT ?? process.env.PORT ?? 3001);
}
await bootstrap();
