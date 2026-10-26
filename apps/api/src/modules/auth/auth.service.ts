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
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma.service.js';

export function getJwtExpiresInSeconds(
  expiresIn = process.env.JWT_EXPIRES_IN ?? '1d',
): number {
  const match = expiresIn.match(/^(\d+)([dhms])?$/);
  if (!match) {
    throw new Error(
      'JWT_EXPIRES_IN must be an integer followed by d, h, m, or s.',
    );
  }

  const value = Number.parseInt(match[1], 10);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error('JWT_EXPIRES_IN must be a positive safe integer.');
  }
  const unit = match[2] ?? 's';

  const multiplier =
    unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1;
  const seconds = value * multiplier;
  if (!Number.isSafeInteger(seconds)) {
    throw new Error('JWT_EXPIRES_IN exceeds the supported duration.');
  }
  return seconds;
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

  async register(email: string, password: string) {
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
        email: normalizedEmail,
        passwordHash,
        loyaltyPoints: 0,
      },
    });

    return {
      id: user.id,
      email: user.email,
      loyaltyPoints: user.loyaltyPoints,
    };
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const invalidCredentials = () =>
      new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid credentials',
        code: 'AUTH_INVALID',
      });

    if (!user) {
      throw invalidCredentials();
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw invalidCredentials();
    }

    const payload = { sub: user.id, email: user.email };
    const expiresIn = getJwtExpiresInSeconds();
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn,
    });

    return {
      accessToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        loyaltyPoints: user.loyaltyPoints,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return null;
    return { id: user.id, email: user.email, loyaltyPoints: user.loyaltyPoints };
  }
}