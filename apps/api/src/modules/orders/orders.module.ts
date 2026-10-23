/**
 * OrdersModule — wiring for the orders feature.
 *
 * Why it exists:
 * - Nest is a dependency-injection framework; the module is the manifest that
 *   tells it which controllers handle requests and which providers they can use.
 *   Without it, OrdersController cannot construct OrdersService and the feature
 *   is not reachable.
 *
 * What it declares:
 * - controllers: [OrdersController]
 * - providers: [OrdersService, PrismaService]
 * - exports: [OrdersService] — so other modules can inject it.
 *
 * Known duplication (infrastructure follow-up):
 * - PrismaService is listed in providers here and in PaymentsModule, so the app
 *   creates two Prisma clients. It works, but the cleaner shape is a PrismaModule
 *   that exports PrismaService and is imported by both feature modules.
 *   Not a Task 10 blocker.
 */

import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../../common/prisma.service.js';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule { }
