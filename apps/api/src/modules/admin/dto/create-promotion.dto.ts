import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PromotionType } from '../../../generated/prisma/enums.js';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsEnum(PromotionType)
  type!: PromotionType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minOrderTotal?: number;

  @IsOptional()
  validFrom?: string | Date;

  @IsNotEmpty()
  validTo!: string | Date;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number | null;
}

