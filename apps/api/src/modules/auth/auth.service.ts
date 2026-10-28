/**
 * AuthService — register, login, and JWT token handling.
 *
 * Why it exists:
 * - Implements the auth contract (api-contract.md §6–§7).
 * - Centralizes password hashing (bcrypt) and JWT signing.
 * - Returns consistent shapes; the controller just passes them through.
 *
 * Contract (api-contract.md §6–§7, ADR 0005 C4):
 * - register: 201 { user: { id, email, loyaltyPoints: 0 } }
 * - login: 200 { accessToken, expiresIn, user: { id, email, loyaltyPoints } }
 * - Errors: 409 EMAIL_TAKEN, 401 AUTH_INVALID (same body for unknown email/wrong password)
 */
import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma.service.js';

type JwtExpiry = Exclude<NonNullable<JwtSignOptions['expiresIn']>, number>;

export function jwtExpiresIn(): JwtExpiry {
  return (process.env.JWT_EXPIRES_IN ?? '1d') as JwtExpiry;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) { }

  private get bcryptRounds(): number {
    return parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10);
  }

  private get jwtSecret(): string {
    return process.env.JWT_SECRET ?? 'dev-secret-change-me';
  }

  private get jwtExpiresIn(): JwtExpiry {
    return jwtExpiresIn();
  }

  async register(name: string, email: string, password: string) {
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 80) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Name must be between 2 and 80 characters long',
        code: 'INVALID_NAME',
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: 'Email already registered',
        code: 'EMAIL_TAKEN',
      });
    }

    const passwordHash = await bcrypt.hash(password, this.bcryptRounds);

    const user = await this.prisma.user.create({
      data: {
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        loyaltyPoints: 0,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      loyaltyPoints: user.loyaltyPoints,
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const invalidCredentials = (): never => {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
        code: 'AUTH_INVALID',
      });
    };

    if (!user) return invalidCredentials();

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return invalidCredentials();

    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresIn,
    });

    // Parse expiresIn to seconds (e.g., "1d" -> 86400)
    const expiresIn = this.parseExpiresIn(this.jwtExpiresIn);

    return {
      accessToken,
      expiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        loyaltyPoints: user.loyaltyPoints,
      },
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    // Supports "1d", "1h", "30m", "60s", or raw seconds "86400"
    const match = expiresIn.match(/^(\d+)([dhms])?$/);
    if (!match) return 86400; // default 1 day

    const value = parseInt(match[1], 10);
    const unit = match[2] ?? 's';

    switch (unit) {
      case 'd': return value * 86400;
      case 'h': return value * 3600;
      case 'm': return value * 60;
      case 's':
      default: return value;
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      loyaltyPoints: user.loyaltyPoints,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Current password is incorrect',
        code: 'CURRENT_PASSWORD_INVALID',
      });
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'New password must be different from the current password',
        code: 'PASSWORD_UNCHANGED',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, this.bcryptRounds);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }
}