/**
 * CartModule — wiring for the saved-cart feature.
 *
 * What it declares:
 * - controllers: [CartController]
 * - providers: [CartService, PrismaService]
 * - imports: [AuthModule] — JwtAuthGuard needs its providers.
 */
import { Module } from '@nestjs/common';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import { PrismaService } from '../../common/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [CartController],
  providers: [CartService, PrismaService],
})
export class CartModule { }
