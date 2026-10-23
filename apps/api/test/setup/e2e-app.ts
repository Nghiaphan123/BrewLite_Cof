import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter.js';
import { PrismaService } from '../../src/common/prisma.service.js';

/**
 * Boots the Nest app for e2e tests with the same pipes and filters as main.ts.
 * Returns the app and a Prisma handle for fixture setup and assertions.
 */
export async function createE2EApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const prisma = app.get(PrismaService);
  return { app, prisma };
}
