import { IsBoolean } from 'class-validator';

/** Body of PATCH /admin/promotions/:id/active: false cancels the code, true turns it back on. */
export class SetPromotionActiveDto {
  @IsBoolean()
  active!: boolean;
}
