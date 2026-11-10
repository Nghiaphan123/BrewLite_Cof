/**
 * SaveCartDto — request body for PUT /api/v1/cart.
 *
 * Fields:
 * - items: the whole cart, possibly empty
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
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CartItemDto {
  @IsUUID()
  productId: string;

  @IsIn(['S', 'M', 'L'])
  size: 'S' | 'M' | 'L';

  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID(undefined, { each: true })
  @IsOptional()
  toppingIds?: string[] = [];

  @IsInt()
  @Min(1)
  @Max(99)
  qty: number;
}

export class SaveCartDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];

  @IsString()
  @MaxLength(40)
  @IsOptional()
  promoCode?: string;
}
