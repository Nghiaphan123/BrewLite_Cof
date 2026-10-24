/**
 * PromotionsController — HTTP surface for POST /api/v1/promotions/validate.
 *
 * Why it exists:
 * - Provides a preview endpoint for the UI to show the discount before
 *   the user places the order.
 * - No auth required (does not mutate state).
 * - Returns the computed discount or the specific error code.
 *
 * Contract:
 * - POST /promotions/validate -> 200 { code, type, value, discountAmount }
 *   or 400/404 with C3 error envelope.
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service.js';
import { ValidatePromotionDto } from './dto/validate-promotion.dto.js';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) { }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validate(@Body() dto: ValidatePromotionDto) {
    return this.promotionsService.validate(dto.code, dto.subtotal);
  }
}