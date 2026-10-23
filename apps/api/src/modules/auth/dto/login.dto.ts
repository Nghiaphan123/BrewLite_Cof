/**
 * LoginDto — request body for POST /api/v1/auth/login.
 *
 * Validation rules per api-contract.md §7:
 * - email: valid email format
 * - password: string (no min length enforced here; bcrypt will fail if wrong)
 */
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}