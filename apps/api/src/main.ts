import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // C1: Base path /api/v1 (ADR 0005)
  app.setGlobalPrefix('api/v1');

  // C3: Standard error envelope filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // API_PORT comes from .env (docs/deployment.md); PORT is set by some hosts such as Render.
  await app.listen(process.env.API_PORT ?? process.env.PORT ?? 3001);
}
await bootstrap();
