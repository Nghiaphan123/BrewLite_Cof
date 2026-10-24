/**
 * ProductsController — public menu routes.
 *
 * Endpoints (api-contract.md §4–§5):
 * - GET /api/v1/products
 * - GET /api/v1/products/:id
 *
 * No auth guard. These routes stay public (ADR 0005).
 */
import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list() {
    return this.productsService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }
}
