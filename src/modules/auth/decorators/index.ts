import { SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/spring-jwt-auth.guard';
import { PERMISSION_KEY, PermissionMetadata, PermissionGuard } from '../guards/permission.guard';

// Re-export audit decorator
export { Audit } from './audit.decorator';

/**
 * Mark a route as public (no authentication required)
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Require specific permission to access a route
 * @param resource The resource name (e.g., 'users', 'workspaces')
 * @param action The action name (e.g., 'read', 'write', 'delete')
 */
export const RequirePermission = (resource: string, action: string) =>
  applyDecorators(
    SetMetadata<string, PermissionMetadata>(PERMISSION_KEY, { resource, action }),
    UseGuards(PermissionGuard),
  );

/**
 * Get the current user from the request
 */
export { CurrentUser } from '../../../common/decorators/current-user.decorator';
