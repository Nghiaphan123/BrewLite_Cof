/**
 * PaymentsController — HTTP surface for POST /api/v1/payments.
 *
 * Why it exists:
 * - Maps the request to PaymentsService.processPayment. No logic here beyond
 *   extracting the Idempotency-Key header and the caller's user id.
 *
 * Response contract (ADR 0004 D2, api-contract.md §9):
 * - 200 for both success and payment failure; the body `status` distinguishes
 *   PAID from PAYMENT_FAILED. Errors (400/401/404/409) come from the service
 *   via Nest exceptions and are formatted by HttpExceptionFilter.
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async createPayment(
    @Body() body: CreatePaymentDto,
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    const userId = req.user.id;

    return this.paymentsService.processPayment({
      userId,
      orderId: body.orderId,
      method: body.method,
      idempotencyKey,
    });
  }
}
