/**
 * AdminController — HTTP surface for admin operations.
 *
 * Endpoints:
 * - GET /api/v1/admin/products
 * - PATCH /api/v1/admin/products/:id/stock
 * - GET /api/v1/admin/toppings
 * - PATCH /api/v1/admin/toppings/:id/stock
 * - GET /api/v1/admin/users
 * - GET /api/v1/admin/promotions
 * - POST /api/v1/admin/promotions
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

  // ------------------- Users
  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
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

