/**
 * CreatePaymentDto — request body for POST /api/v1/payments.
 *
 * Fields:
 * - orderId: the order being paid. Should be @IsUUID() to match the ERD
 *   (orders have UUID ids); @IsString() is currently looser than the schema.
 * - method: WALLET | CARD. Both are required by the assignment (PDF US-05,
 *   wireframe §7: Ví điện tử / Thẻ ngân hàng). The mock gateway treats them
 *   the same; the choice is the user's.
 *
 * Validation:
 * - Enforced by ValidationPipe (main.ts, e2e-app.ts). A missing or invalid
 *   field returns 400 with the ADR 0005 C3 envelope.
 */

import { IsString, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  orderId: string;

  @IsIn(['WALLET', 'CARD'])
  method: 'WALLET' | 'CARD';
}
