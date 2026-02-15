import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SpringServicesClientService } from '../spring-services-client.service';

export const PERMISSION_KEY = 'permission';
export const RESOURCE_KEY = 'resource';

export interface PermissionMetadata {
  resource: string;
  action: string;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private springServicesClient: SpringServicesClientService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<PermissionMetadata>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permission metadata, allow access
    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract workspace ID from request params, query, or body
    const workspaceId =
      request.params?.workspaceId ||
      request.query?.workspaceId ||
      request.body?.workspaceId ||
      request.headers['x-workspace-id'];

    if (!workspaceId) {
      this.logger.warn('No workspace ID found in request for permission check');
      // If no workspace context, check local permissions
      return this.checkLocalPermissions(user, permission);
    }

    try {
      // Get the access token from the request
      const authHeader = request.headers.authorization;
      const accessToken = authHeader?.replace('Bearer ', '');

      const result = await this.springServicesClient.checkPermission(
        {
          userId: user.springAuthId || user._id,
          workspaceId,
          resource: permission.resource,
          action: permission.action,
        },
        accessToken,
      );

      if (!result.allowed) {
        this.logger.warn(
          `Permission denied for user ${user._id}: ${permission.resource}:${permission.action}`,
          { reason: result.reason },
        );
        throw new ForbiddenException(result.reason || 'Permission denied');
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(`Permission check failed: ${error.message}`);
      // Fall back to local permission check if permission service is unavailable
      return this.checkLocalPermissions(user, permission);
    }
  }

  private checkLocalPermissions(user: any, permission: PermissionMetadata): boolean {
    // Check if user has the required permission locally
    const requiredPermission = `${permission.resource}:${permission.action}`;

    if (user.permissions?.includes(requiredPermission)) {
      return true;
    }

    // Check if user has admin role
    if (user.role === 'admin' || user.role === 'super_admin') {
      return true;
    }

    throw new ForbiddenException('Permission denied');
  }
}
