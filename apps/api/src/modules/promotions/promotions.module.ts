/**
 * PromotionsModule — wiring for the promotions feature.
 *
 * Why it exists:
 * - Declares PromotionsController and PromotionsService so Nest can construct them.
 * - Exports PromotionsService so other modules (OrdersModule) can inject it.
 */

import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller.js';
import { PromotionsService } from './promotions.service.js';
import { PrismaService } from '../../common/prisma.service.js';

@Module({
  controllers: [PromotionsController],
  providers: [PromotionsService, PrismaService],
  exports: [PromotionsService],
})
export class PromotionsModule { }