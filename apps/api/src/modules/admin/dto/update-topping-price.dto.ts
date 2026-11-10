import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Body of PATCH /admin/toppings/:id/price: the new price of one portion, whole VND. */
export class UpdateToppingPriceDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  price!: number;
}
