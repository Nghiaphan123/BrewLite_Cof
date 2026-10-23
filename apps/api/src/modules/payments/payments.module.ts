/**
 * PaymentsModule — wiring for the payments feature.
 *
 * Why it exists:
 * - Declares PaymentsController and PaymentsService so Nest can construct them.
 * - exports PaymentsService so other modules (a future checkout/order flow) can
 *   inject it.
 *
 * Known duplication (infrastructure follow-up):
 * - PrismaService is listed in providers here and in OrdersModule, so the app
 *   creates two Prisma clients. The cleaner shape is a PrismaModule that
 *   exports PrismaService and is imported by both feature modules.
 */

import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { PrismaService } from '../../common/prisma.service.js';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PrismaService],
  exports: [PaymentsService],
})
export class PaymentsModule { }
