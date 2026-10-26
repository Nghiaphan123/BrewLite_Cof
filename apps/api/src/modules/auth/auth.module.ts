/**
 * AuthModule — wiring for the auth feature.
 *
 * Why it exists:
 * - Declares AuthController and AuthService so Nest can construct them.
 * - Exports AuthService so other modules (e.g., JwtAuthGuard) can inject it.
 */
import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService, getJwtExpiresInSeconds } from './auth.service.js';
import { PrismaService } from '../../common/prisma.service.js';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: getJwtExpiresInSeconds() },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
  exports: [AuthService, JwtModule],
})
export class AuthModule { }