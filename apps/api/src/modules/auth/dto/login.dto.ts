/**
 * LoginDto — request body for POST /api/v1/auth/login.
 *
 * Validation rules:
 * - email: valid email or username string (e.g. "admin")
 * - password: string
 */
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
