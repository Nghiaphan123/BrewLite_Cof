/**
 * ProductsModule — wiring for the menu API (Task 15).
 *
 * PrismaService is provided here, same as OrdersModule and PaymentsModule.
 * A shared PrismaModule would avoid a second client; that cleanup is separate.
 */
import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService],
  exports: [ProductsService],
})
export class ProductsModule {}
