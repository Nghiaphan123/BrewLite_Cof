/**
 * Public liveness check. ADR 0005 and api-contract.md §3.
 * No JWT. Does not touch the database.
 */
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok'; version: 'v1' } {
    return { status: 'ok', version: 'v1' };
  }
}
