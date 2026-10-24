import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { PromotionsModule } from './modules/promotions/promotions.module.js';

@Module({
  imports: [AuthModule, OrdersModule, PaymentsModule, ProductsModule, PromotionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
