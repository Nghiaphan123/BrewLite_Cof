/**
 * RegisterDto — request body for POST /api/v1/auth/register.
 *
 * Validation rules per api-contract.md §6:
 * - email: valid email format, normalized to lowercase before storage
 * - password: ≥ 8 chars, at least one letter and one digit
 */
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one digit',
  })
  password: string;
}