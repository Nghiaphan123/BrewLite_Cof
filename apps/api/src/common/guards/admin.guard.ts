/**
 * AdminGuard — enforces role === 'ADMIN' on protected admin routes.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Admin access required',
        code: 'FORBIDDEN',
      });
    }

    return true;
  }
}

