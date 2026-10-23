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
 *
 * Known gap (Task 7):
 * - userId is read from req.user?.id ?? headers['x-user-id'] ?? 'user-demo-001'.
 *   There is no JwtAuthGuard yet, so X-User-Id is a spoofable identity and the
 *   e2e tests rely on it. When Task 7's guard lands, delete the header fallback
 *   and derive userId from req.user only.
 */

import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post()
  @HttpCode(HttpStatus.OK)
  async createPayment(
    @Body() body: CreatePaymentDto,
    @Req() req: any,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    const headers = req.headers ?? {};
    const userId = req.user?.id ?? headers['x-user-id'] ?? 'user-demo-001';

    return this.paymentsService.processPayment({
      userId,
      orderId: body.orderId,
      method: body.method,
      idempotencyKey,
    });
  }
}
