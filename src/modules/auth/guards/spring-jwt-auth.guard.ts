import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class SpringJwtAuthGuard extends AuthGuard('spring-jwt') {
  private readonly logger = new Logger(SpringJwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
    this.logger.debug('SpringJwtAuthGuard constructed');
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    console.log('=== [SpringJwtAuthGuard] canActivate called ===');
    const request = context.switchToHttp().getRequest();
    console.log('[SpringJwtAuthGuard] URL:', request.url);
    console.log('[SpringJwtAuthGuard] Authorization header:', request.headers.authorization?.substring(0, 50) + '...');
    this.logger.debug('SpringJwtAuthGuard.canActivate called');
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    this.logger.debug(`isPublic: ${isPublic}`);

    if (isPublic) {
      return true;
    }

    this.logger.debug('Calling super.canActivate...');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    console.log('=== [SpringJwtAuthGuard] handleRequest called ===');
    console.log('[SpringJwtAuthGuard] err:', err);
    console.log('[SpringJwtAuthGuard] user:', JSON.stringify(user));
    console.log('[SpringJwtAuthGuard] info:', info);
    this.logger.debug(`handleRequest called - err: ${err}, user: ${JSON.stringify(user)}, info: ${info}`);

    if (err || !user) {
      console.log('[SpringJwtAuthGuard] Throwing UnauthorizedException');
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
