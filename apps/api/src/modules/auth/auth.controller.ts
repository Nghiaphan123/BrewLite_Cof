/**
 * AuthController — HTTP surface for registration, login, and account settings.
 *
 * Why it exists:
 * - Maps the two auth endpoints to AuthService.
 * - Uses ValidationPipe DTOs (main.ts / e2e-app.ts) for 400 validation.
 * - Registration/login are public; profile/password routes require JWT.
 *
 * Contract (api-contract.md §6–§7):
 * - POST /auth/register -> 201 { user }
 * - POST /auth/login -> 200 { accessToken, expiresIn, user }
 */
import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(
      dto.name,
      dto.email,
      dto.password,
    );
    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}