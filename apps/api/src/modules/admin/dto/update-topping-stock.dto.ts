import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateToppingStockDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;
}

