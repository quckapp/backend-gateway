import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SpringServicesClientService } from '../spring-services-client.service';

export const AUDIT_KEY = 'audit';

export interface AuditMetadata {
  action: string;
  resourceType: string;
  resourceIdParam?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private reflector: Reflector,
    private springServicesClient: SpringServicesClientService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const audit = this.reflector.getAllAndOverride<AuditMetadata>(AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no audit metadata, skip logging
    if (!audit) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.logAuditEvent(request, user, audit, response, null, Date.now() - startTime);
        },
        error: (error) => {
          this.logAuditEvent(request, user, audit, null, error, Date.now() - startTime);
        },
      }),
    );
  }

  private async logAuditEvent(
    request: any,
    user: any,
    audit: AuditMetadata,
    response: any,
    error: any,
    durationMs: number,
  ): Promise<void> {
    try {
      // Extract workspace ID from request
      const workspaceId =
        request.params?.workspaceId ||
        request.query?.workspaceId ||
        request.body?.workspaceId ||
        request.headers['x-workspace-id'] ||
        'system';

      // Extract resource ID
      let resourceId = 'unknown';
      if (audit.resourceIdParam && request.params?.[audit.resourceIdParam]) {
        resourceId = request.params[audit.resourceIdParam];
      } else if (response?.id) {
        resourceId = response.id;
      } else if (response?.data?.id) {
        resourceId = response.data.id;
      }

      // Get the access token from the request
      const authHeader = request.headers.authorization;
      const accessToken = authHeader?.replace('Bearer ', '');

      await this.springServicesClient.createAuditLog(
        {
          workspaceId,
          actorId: user?.springAuthId || user?._id || 'anonymous',
          actorEmail: user?.email || 'anonymous',
          actorType: user?.springAuthId ? 'USER' : 'SYSTEM',
          action: audit.action,
          resourceType: audit.resourceType,
          resourceId,
          details: {
            method: request.method,
            path: request.path,
            statusCode: error ? error.status || 500 : 200,
            durationMs,
            success: !error,
            errorMessage: error?.message,
            requestBody: this.sanitizeRequestBody(request.body),
          },
          ipAddress: this.getClientIp(request),
          userAgent: request.headers['user-agent'],
        },
        accessToken,
      );

      this.logger.debug(`Audit log created: ${audit.action} on ${audit.resourceType}:${resourceId}`);
    } catch (err) {
      // Don't throw on audit logging failure
      this.logger.error(`Failed to create audit log: ${err.message}`);
    }
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.ip ||
      request.connection?.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return null;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
