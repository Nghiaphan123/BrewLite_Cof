import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  // API_PORT comes from .env (docs/deployment.md); PORT is set by some hosts such as Render.
  await app.listen(process.env.API_PORT ?? process.env.PORT ?? 3001);
}
await bootstrap();
