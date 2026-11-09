import { IsBoolean } from 'class-validator';

/** Body of PATCH /admin/users/:id/block: true blocks the account, false opens it again. */
export class SetUserBlockedDto {
  @IsBoolean()
  blocked!: boolean;
}
