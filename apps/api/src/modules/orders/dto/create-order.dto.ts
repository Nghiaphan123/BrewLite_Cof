/**
 * CreateOrderDto — request body for POST /api/v1/orders.
 *
 * Fields:
 * - items: non-empty array of order items
 *   - productId: UUID of the product
 *   - size: S | M | L
 *   - toppingIds: optional array of topping UUIDs (default [])
 *   - qty: integer 1..99
 * - promoCode: optional promotion code (string)
 *
 * Validation:
 * - Enforced by ValidationPipe (main.ts, e2e-app.ts). A missing or invalid
 *   field returns 400 with the ADR 0005 C3 envelope.
 */
import { IsArray, IsString, IsUUID, IsIn, IsInt, Min, Max, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsIn(['S', 'M', 'L'])
  size: 'S' | 'M' | 'L';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  toppingIds?: string[] = [];

  @IsInt()
  @Min(1)
  @Max(99)
  qty: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsOptional()
  promoCode?: string;
}