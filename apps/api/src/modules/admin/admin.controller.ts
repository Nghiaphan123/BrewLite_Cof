/**
 * AdminController — HTTP surface for admin operations.
 *
 * Endpoints:
 * - GET /api/v1/admin/products
 * - PATCH /api/v1/admin/products/:id/stock
 * - GET /api/v1/admin/toppings
 * - PATCH /api/v1/admin/toppings/:id/stock
 * - PATCH /api/v1/admin/toppings/:id/price
 * - GET /api/v1/admin/users
 * - PATCH /api/v1/admin/users/:id/block
 * - GET /api/v1/admin/promotions
 * - POST /api/v1/admin/promotions
 * - PATCH /api/v1/admin/promotions/:id/active
 * - GET /api/v1/admin/orders
 * - PATCH /api/v1/admin/orders/:id/status
 */
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AdminGuard } from '../../common/guards/admin.guard.js';
import { AdminService } from './admin.service.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { UpdateToppingStockDto } from './dto/update-topping-stock.dto.js';
import { UpdateProductStockDto } from './dto/update-product-stock.dto.js';
import { UpdateToppingPriceDto } from './dto/update-topping-price.dto.js';
import { SetUserBlockedDto } from './dto/set-user-blocked.dto.js';
import { SetPromotionActiveDto } from './dto/set-promotion-active.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  // ------------------- Products (drink stock)
  @Get('products')
  listProducts() {
    return this.adminService.listProducts();
  }

  @Patch('products/:id/stock')
  updateProductStock(
    @Param('id') id: string,
    @Body() dto: UpdateProductStockDto,
  ) {
    return this.adminService.updateProductStock(id, dto.stock);
  }

  // ------------------- Toppings
  @Get('toppings')
  listToppings() {
    return this.adminService.listToppings();
  }

  @Patch('toppings/:id/stock')
  updateToppingStock(
    @Param('id') id: string,
    @Body() dto: UpdateToppingStockDto,
  ) {
    return this.adminService.updateToppingStock(id, dto.stock);
  }

  @Patch('toppings/:id/price')
  updateToppingPrice(
    @Param('id') id: string,
    @Body() dto: UpdateToppingPriceDto,
  ) {
    return this.adminService.updateToppingPrice(id, dto.price);
  }

  // ------------------- Users
  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/block')
  setUserBlocked(
    @Param('id') id: string,
    @Body() dto: SetUserBlockedDto,
  ) {
    return this.adminService.setUserBlocked(id, dto.blocked);
  }

  // ------------------- Promotions
  @Get('promotions')
  listPromotions() {
    return this.adminService.listPromotions();
  }

  @Post('promotions')
  @HttpCode(HttpStatus.CREATED)
  createPromotion(@Body() dto: CreatePromotionDto) {
    return this.adminService.createPromotion(dto);
  }

  @Patch('promotions/:id/active')
  setPromotionActive(
    @Param('id') id: string,
    @Body() dto: SetPromotionActiveDto,
  ) {
    return this.adminService.setPromotionActive(id, dto.active);
  }

  // ------------------- Orders
  @Get('orders')
  listOrders() {
    return this.adminService.listOrders();
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto.status);
  }
}

