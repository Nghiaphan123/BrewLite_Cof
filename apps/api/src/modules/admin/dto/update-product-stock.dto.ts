import { IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/** Body of PATCH /admin/products/:id/stock: the new number of cups in stock. */
export class UpdateProductStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  stock!: number;
}
