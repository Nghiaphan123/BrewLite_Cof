import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { requestIdFrom } from './request-id.middleware.js';

function shouldLogSuccess(): boolean {
  const level = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  return level === 'debug' || level === 'info';
}

function pathOnly(url: string | undefined): string {
  return (url ?? '/').split('?')[0];
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest<{ method?: string; url?: string; headers: Record<string, unknown> }>();
    const started = Date.now();
    const requestId = requestIdFrom(req as never);
    const method = req.method ?? 'UNKNOWN';
    const path = pathOnly(req.url);

    return next.handle().pipe(
      tap(() => {
        if (!shouldLogSuccess()) return;
        const status = http.getResponse<{ statusCode?: number }>().statusCode ?? 200;
        this.logger.log(`${method} ${path} ${status} ${Date.now() - started}ms requestId=${requestId}`);
      }),
      catchError((error: unknown) => {
        const status = error instanceof HttpException ? error.getStatus() : 500;
        this.logger.warn(`${method} ${path} ${status} ${Date.now() - started}ms requestId=${requestId}`);
        return throwError(() => error);
      }),
    );
  }
}
