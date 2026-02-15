import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService, HttpResponse } from '../../common/http/http.service';

// ============================================
// Shared Types
// ============================================

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================
// User Service Types
// ============================================

export interface UserResponse {
  id: string;
  externalId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  status: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  externalId: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status?: string;
}

// ============================================
// Permission Service Types
// ============================================

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionCheckRequest {
  userId: string;
  workspaceId: string;
  resource: string;
  action: string;
}

export interface PermissionCheckResponse {
  allowed: boolean;
  userId: string;
  resource: string;
  action: string;
  reason?: string;
}

export interface UserPermissionsResponse {
  userId: string;
  workspaceId: string;
  roles: RoleResponse[];
  permissions: string[];
}

// ============================================
// Audit Service Types
// ============================================

export interface CreateAuditLogRequest {
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogResponse {
  id: string;
  workspaceId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  timestamp: string;
}

// ============================================
// Admin Service Types
// ============================================

export interface SystemSettingResponse {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagResponse {
  id: string;
  featureKey: string;
  enabled: boolean;
  description: string;
  workspaceIds: string[];
  userIds: string[];
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceHealthResponse {
  name: string;
  status: string;
  responseTimeMs: number;
  url: string;
  lastChecked: string;
}

export interface SystemHealthResponse {
  overall: string;
  services: ServiceHealthResponse[];
  timestamp: string;
}

// ============================================
// Spring Services Client
// ============================================

@Injectable()
export class SpringServicesClientService {
  private readonly logger = new Logger(SpringServicesClientService.name);

  private readonly userServiceUrl: string;
  private readonly permissionServiceUrl: string;
  private readonly auditServiceUrl: string;
  private readonly adminServiceUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.userServiceUrl = this.configService.get('SPRING_USER_SERVICE_URL') || 'http://localhost:8082';
    this.permissionServiceUrl = this.configService.get('SPRING_PERMISSION_SERVICE_URL') || 'http://localhost:8083';
    this.auditServiceUrl = this.configService.get('SPRING_AUDIT_SERVICE_URL') || 'http://localhost:8084';
    this.adminServiceUrl = this.configService.get('SPRING_ADMIN_SERVICE_URL') || 'http://localhost:8085';
    this.apiKey = this.configService.get('SPRING_SERVICES_API_KEY') || '';
    this.timeout = parseInt(this.configService.get('SPRING_SERVICES_TIMEOUT') || '10000', 10);
  }

  // ============================================
  // User Service Methods
  // ============================================

  async getUser(userId: string, accessToken?: string): Promise<UserResponse> {
    return this.makeRequest<ApiResponse<UserResponse>>(
      this.userServiceUrl,
      'GET',
      `/api/users/${userId}`,
      null,
      accessToken,
    ).then(r => r.data);
  }

  async getUserByExternalId(externalId: string, accessToken?: string): Promise<UserResponse> {
    return this.makeRequest<ApiResponse<UserResponse>>(
      this.userServiceUrl,
      'GET',
      `/api/users/external/${externalId}`,
      null,
      accessToken,
    ).then(r => r.data);
  }

  async createUser(request: CreateUserRequest, accessToken?: string): Promise<UserResponse> {
    return this.makeRequest<ApiResponse<UserResponse>>(
      this.userServiceUrl,
      'POST',
      '/api/users',
      request,
      accessToken,
    ).then(r => r.data);
  }

  async updateUser(userId: string, request: UpdateUserRequest, accessToken?: string): Promise<UserResponse> {
    return this.makeRequest<ApiResponse<UserResponse>>(
      this.userServiceUrl,
      'PUT',
      `/api/users/${userId}`,
      request,
      accessToken,
    ).then(r => r.data);
  }

  async searchUsers(query: string, page = 0, size = 20, accessToken?: string): Promise<PagedResponse<UserResponse>> {
    return this.makeRequest<ApiResponse<PagedResponse<UserResponse>>>(
      this.userServiceUrl,
      'GET',
      `/api/users/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`,
      null,
      accessToken,
    ).then(r => r.data);
  }

  // ============================================
  // Permission Service Methods
  // ============================================

  async checkPermission(request: PermissionCheckRequest, accessToken?: string): Promise<PermissionCheckResponse> {
    return this.makeRequest<ApiResponse<PermissionCheckResponse>>(
      this.permissionServiceUrl,
      'POST',
      '/api/permissions/check',
      request,
      accessToken,
    ).then(r => r.data);
  }

  async getUserPermissions(userId: string, workspaceId: string, accessToken?: string): Promise<UserPermissionsResponse> {
    return this.makeRequest<ApiResponse<UserPermissionsResponse>>(
      this.permissionServiceUrl,
      'GET',
      `/api/user-roles/user/${userId}/workspace/${workspaceId}`,
      null,
      accessToken,
    ).then(r => r.data);
  }

  async getRolesByWorkspace(workspaceId: string, accessToken?: string): Promise<RoleResponse[]> {
    return this.makeRequest<ApiResponse<RoleResponse[]>>(
      this.permissionServiceUrl,
      'GET',
      `/api/roles/workspace/${workspaceId}`,
      null,
      accessToken,
    ).then(r => r.data);
  }

  async assignRole(userId: string, roleId: string, workspaceId: string, accessToken?: string): Promise<void> {
    await this.makeRequest<ApiResponse<void>>(
      this.permissionServiceUrl,
      'POST',
      '/api/user-roles',
      { userId, roleId, workspaceId },
      accessToken,
    );
  }

  async revokeRole(userId: string, roleId: string, workspaceId: string, accessToken?: string): Promise<void> {
    await this.makeRequest<ApiResponse<void>>(
      this.permissionServiceUrl,
      'DELETE',
      `/api/user-roles/user/${userId}/role/${roleId}/workspace/${workspaceId}`,
      null,
      accessToken,
    );
  }

  // ============================================
  // Audit Service Methods
  // ============================================

  async createAuditLog(request: CreateAuditLogRequest, accessToken?: string): Promise<AuditLogResponse> {
    return this.makeRequest<ApiResponse<AuditLogResponse>>(
      this.auditServiceUrl,
      'POST',
      '/api/audit/logs',
      request,
      accessToken,
    ).then(r => r.data);
  }

  async getAuditLogs(workspaceId: string, page = 0, size = 20, accessToken?: string): Promise<PagedResponse<AuditLogResponse>> {
    return this.makeRequest<ApiResponse<PagedResponse<AuditLogResponse>>>(
      this.auditServiceUrl,
      'GET',
      `/api/audit/logs/workspace/${workspaceId}?page=${page}&size=${size}`,
      null,
      accessToken,
    ).then(r => r.data);
  }

  async searchAuditLogs(searchRequest: any, accessToken?: string): Promise<PagedResponse<AuditLogResponse>> {
    return this.makeRequest<ApiResponse<PagedResponse<AuditLogResponse>>>(
      this.auditServiceUrl,
      'POST',
      '/api/audit/logs/search',
      searchRequest,
      accessToken,
    ).then(r => r.data);
  }

  // ============================================
  // Admin Service Methods
  // ============================================

  async getSystemHealth(accessToken?: string): Promise<SystemHealthResponse> {
    return this.makeRequest<ApiResponse<SystemHealthResponse>>(
      this.adminServiceUrl,
      'GET',
      '/api/admin/health/services',
      null,
      accessToken,
    ).then(r => r.data);
  }

  async getFeatureFlag(featureKey: string, accessToken?: string): Promise<FeatureFlagResponse> {
    return this.makeRequest<ApiResponse<FeatureFlagResponse>>(
      this.adminServiceUrl,
      'GET',
      `/api/admin/features/${featureKey}`,
      null,
      accessToken,
    ).then(r => r.data);
  }

  async checkFeature(featureKey: string, userId?: string, workspaceId?: string, accessToken?: string): Promise<boolean> {
    const response = await this.makeRequest<ApiResponse<{ enabled: boolean }>>(
      this.adminServiceUrl,
      'POST',
      '/api/admin/features/check',
      { featureKey, userId, workspaceId },
      accessToken,
    );
    return response.data.enabled;
  }

  async getSystemSettings(category?: string, accessToken?: string): Promise<SystemSettingResponse[]> {
    const path = category
      ? `/api/admin/settings/category/${category}`
      : '/api/admin/settings';
    return this.makeRequest<ApiResponse<SystemSettingResponse[]>>(
      this.adminServiceUrl,
      'GET',
      path,
      null,
      accessToken,
    ).then(r => r.data);
  }

  // ============================================
  // Health Check Methods
  // ============================================

  async checkUserServiceHealth(): Promise<boolean> {
    return this.checkServiceHealth(this.userServiceUrl);
  }

  async checkPermissionServiceHealth(): Promise<boolean> {
    return this.checkServiceHealth(this.permissionServiceUrl);
  }

  async checkAuditServiceHealth(): Promise<boolean> {
    return this.checkServiceHealth(this.auditServiceUrl);
  }

  async checkAdminServiceHealth(): Promise<boolean> {
    return this.checkServiceHealth(this.adminServiceUrl);
  }

  private async checkServiceHealth(baseUrl: string): Promise<boolean> {
    try {
      await this.httpService.get(`${baseUrl}/actuator/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private async makeRequest<T>(
    baseUrl: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any,
    accessToken?: string,
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key for service-to-service authentication
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    // Add user access token if provided
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      let response: HttpResponse<T>;

      switch (method) {
        case 'GET':
          response = await this.httpService.get<T>(url, {
            headers,
            timeout: this.timeout,
            retries: 2,
            retryDelay: 500,
          });
          break;
        case 'POST':
          response = await this.httpService.post<T>(url, data, {
            headers,
            timeout: this.timeout,
            retries: 1,
            retryDelay: 500,
          });
          break;
        case 'PUT':
          response = await this.httpService.put<T>(url, data, {
            headers,
            timeout: this.timeout,
            retries: 1,
            retryDelay: 500,
          });
          break;
        case 'DELETE':
          response = await this.httpService.delete<T>(url, {
            headers,
            timeout: this.timeout,
            retries: 1,
            retryDelay: 500,
          });
          break;
      }

      if (response.status >= 400) {
        this.handleErrorResponse(response, url);
      }

      return response.data;
    } catch (error: any) {
      this.logger.error(`Spring Service request failed: ${method} ${url}`, {
        error: error.message,
        status: error.status,
      });

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      throw new ServiceUnavailableException(`Service at ${baseUrl} is temporarily unavailable`);
    }
  }

  private handleErrorResponse(response: HttpResponse<any>, url: string): void {
    const { status, data } = response;
    const message = data?.message || data?.error || 'Unknown error';

    switch (status) {
      case 400:
        throw new BadRequestException(message);
      case 403:
        throw new ForbiddenException(message);
      case 404:
        throw new NotFoundException(message);
      case 409:
        throw new BadRequestException(message);
      case 429:
        throw new BadRequestException('Too many requests. Please try again later.');
      default:
        if (status >= 500) {
          throw new ServiceUnavailableException(`Service error at ${url}`);
        }
        throw new BadRequestException(message);
    }
  }
}
