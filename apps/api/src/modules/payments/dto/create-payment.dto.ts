/**
 * CreatePaymentDto — request body for POST /api/v1/payments.
 *
 * Fields:
 * - orderId: the order being paid, a UUID (orders.id is a UUID column).
 *   A malformed id is rejected here with 400, before any database query.
 * - method: WALLET | CARD. Both are required by the assignment (PDF US-05,
 *   wireframe §7: Ví điện tử / Thẻ ngân hàng). The mock gateway treats them
 *   the same; the choice is the user's.
 *
 * Validation:
 * - Enforced by ValidationPipe (main.ts, e2e-app.ts). A missing or invalid
 *   field returns 400 with the ADR 0005 C3 envelope.
 */

import { IsUUID, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsIn(['WALLET', 'CARD'])
  method: 'WALLET' | 'CARD';
}
