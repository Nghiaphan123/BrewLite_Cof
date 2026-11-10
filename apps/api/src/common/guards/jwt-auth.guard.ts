/**
 * JwtAuthGuard — validates JWT from Authorization: Bearer <token> header.
 *
 * Why it exists:
 * - Implements ADR 0005 C4: protected routes require JWT.
 * - Applied per-controller (not global) so public routes (health, products, auth)
 *   stay accessible.
 *
 * Behavior:
 * - Extracts token from Authorization header.
 * - Verifies with JWT_SECRET via @nestjs/jwt.
 * - On success: sets request.user = { id: payload.sub, email: payload.email, role: user.role }.
 * - On missing/invalid/expired: throws UnauthorizedException with
 *   code AUTH_REQUIRED (missing) or AUTH_EXPIRED (expired).
 *   HttpExceptionFilter maps these to the C3 envelope.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService, accountBlocked } from '../../modules/auth/auth.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly authService: AuthService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer "

    let payload: { sub: string; email: string; role?: string };
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Token expired',
          code: 'AUTH_EXPIRED',
        });
      }
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid token',
        code: 'AUTH_INVALID',
      });
    }

    // Optionally validate user still exists (e.g., not deleted)
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'User not found',
        code: 'AUTH_INVALID',
      });
    }

    // A token issued before the admin blocked the account stops working at once,
    // not only when it expires.
    if (user.blocked) {
      throw accountBlocked();
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: user.role ?? payload.role ?? 'CUSTOMER',
    };
    return true;
  }
}
