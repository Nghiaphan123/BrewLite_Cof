/**
 * HttpExceptionFilter — the global error filter that turns thrown exceptions
 * into the standard JSON envelope described in ADR 0005 C3.
 *
 * Why it exists:
 * - Nest's default exception layer returns a shape close to C3 but not
 *   identical: it has no `code`, no `details`, and it does not know about
 *   domain errors such as InvalidStateTransitionError (Task 10a). Without
 *   this filter, the same failure returns different shapes depending on
 *   where it was thrown, and the frontend's single error parser
 *   (apps/web/src/lib/api.ts) breaks.
 * - It is registered once, in main.ts and in test/setup/e2e-app.ts, so every
 *   route uses it. A feature does not register its own filter.
 *
 * What it maps:
 * - InvalidStateTransitionError  -> 409, code INVALID_STATE_TRANSITION
 * - HttpException with an object body -> status, error, message, code, details
 * - HttpException with a string body  -> status, error, message
 * - Anything else                     -> 500, generic message
 *   (the real error is logged; it never reaches the client)
 *
 * Contract:
 * - The envelope is ADR 0005 C3: { statusCode, error, message, code?, details? }.
 *   Feature services throw Nest exceptions (BadRequestException,
 *   ConflictException, NotFoundException) and pass the `code` in the
 *   exception body; this filter copies it through. Services do not format
 *   the HTTP response themselves.
 *
 * Placement:
 * - Lives in `common/` because every module's errors flow through it.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { InvalidStateTransitionError } from '../modules/orders/order-state-machine.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof InvalidStateTransitionError) {
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: exception.message,
        code: 'INVALID_STATE_TRANSITION',
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        return response.status(status).json({
          statusCode: status,
          error: (res as any).error ?? HttpStatus[status],
          message: (res as any).message ?? exception.message,
          code: (res as any).code,
          details: (res as any).details,
        });
      }

      return response.status(status).json({
        statusCode: status,
        error: HttpStatus[status],
        message: res ?? exception.message,
      });
    }

    // Default 500 error envelope per ADR 0005 C3
    console.error('Unhandled exception in HttpExceptionFilter:', exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: (exception as any)?.message ?? 'Lỗi hệ thống nội bộ',
    });
  }
}
