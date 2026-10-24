/**
 * ValidatePromotionDto — request body for POST /api/v1/promotions/validate.
 *
 * Fields:
 * - code: promotion code (required, non-empty)
 * - subtotal: order subtotal in VND (required, integer >= 0)
 *
 * Validation:
 * - Enforced by ValidationPipe. Returns 400 with C3 envelope on failure.
 */
import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';

export class ValidatePromotionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsInt()
  @Min(0)
  subtotal: number;
}