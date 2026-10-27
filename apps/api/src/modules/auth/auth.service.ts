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
    return { id: user.id, email: user.email, loyaltyPoints: user.loyaltyPoints };
  }
}