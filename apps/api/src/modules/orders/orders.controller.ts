/**
 * OrdersController — HTTP surface for order operations.
 *
 * Why it exists:
 * - Maps routes to OrdersService calls. No business logic, no database access.
 *
 * Endpoints:
 * - POST /api/v1/orders/:id/transition — drive a status change.
 *   Returns { id, status }.
 *
 * Contract status (Task 7 follow-up):
 * - This endpoint is NOT in api-contract.md §2. It was added so graded test (a)
 *   can drive an invalid transition through the API (test/order-state-machine.e2e-spec.ts).
 *   It must be documented in api-contract.md §12 as an internal/test endpoint,
 *   or removed and the test driven through POST /payments against a COMPLETED
 *   order. As written, the API has a surface the contract does not describe.
 *
 * Param note:
 * - The route uses `:id` (UUID) for now. The API contract (§11) specifies
 *   orders are keyed by `code` (BL-YYYY-NNNN) in user-facing URLs. Once the
 *   `code` field is added to the Prisma schema and order creation generates it,
 *   this should become `:code` and the service should look up by code.
 *
 * Validation:
 * - TransitionDto uses class-validator IsEnum to reject malformed `next`
 *   values with 400 before they reach the service.
 */

import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { OrdersService } from './orders.service.js';
import { OrderStatus } from '../../generated/prisma/enums.js';

class TransitionDto {
  @IsEnum(OrderStatus, { message: 'next must be a valid OrderStatus' })
  next!: OrderStatus;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  async transitionOrder(
    @Param('id') id: string,
    @Body() dto: TransitionDto,
  ) {
    const updated = await this.ordersService.transition(id, dto.next);
    return {
      id: updated.id,
      status: updated.status,
    };
  }
}
