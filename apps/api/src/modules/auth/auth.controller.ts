/**
 * AuthController — HTTP surface for POST /api/v1/auth/register and /login.
 *
 * Why it exists:
 * - Maps the two auth endpoints to AuthService.
 * - Uses ValidationPipe DTOs (main.ts / e2e-app.ts) for 400 validation.
 * - No auth guard here; these are public endpoints.
 *
 * Contract (api-contract.md §6–§7):
 * - POST /auth/register -> 201 { user }
 * - POST /auth/login -> 200 { accessToken, expiresIn, user }
 */
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto.email, dto.password);
    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
}