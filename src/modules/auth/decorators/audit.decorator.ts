import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { AUDIT_KEY, AuditMetadata, AuditInterceptor } from '../interceptors/audit.interceptor';

/**
 * Enable audit logging for a route
 * @param action The action being performed (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN')
 * @param resourceType The type of resource (e.g., 'USER', 'WORKSPACE', 'CONVERSATION')
 * @param resourceIdParam Optional parameter name for the resource ID (e.g., 'id', 'userId')
 */
export const Audit = (action: string, resourceType: string, resourceIdParam?: string) =>
  applyDecorators(
    SetMetadata<string, AuditMetadata>(AUDIT_KEY, { action, resourceType, resourceIdParam }),
    UseInterceptors(AuditInterceptor),
  );
