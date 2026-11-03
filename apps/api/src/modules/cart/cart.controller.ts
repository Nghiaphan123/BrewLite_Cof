/**
 * CartController — HTTP surface for the caller's saved cart.
 *
 * Endpoints (api-contract.md §11.1, both JWT required):
 * - GET /api/v1/cart — the caller's cart.
 * - PUT /api/v1/cart — replace the whole cart. An empty items array clears it.
 *
 * The user id always comes from the token, so one customer cannot read or
 * change another customer's cart.
 */
import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { SaveCartDto } from './dto/save-cart.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) { }

  @Get()
  get(@Req() req: { user: { id: string } }) {
    return this.cartService.get(req.user.id);
  }

  @Put()
  replace(@Body() dto: SaveCartDto, @Req() req: { user: { id: string } }) {
    return this.cartService.replace(req.user.id, dto.items, dto.promoCode);
  }
}
