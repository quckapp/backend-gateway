import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { SpringAuthClientService } from '../spring-auth-client.service';

@Injectable()
export class SpringJwtStrategy extends PassportStrategy(Strategy, 'spring-jwt') {
  private readonly logger = new Logger(SpringJwtStrategy.name);
  private readonly useSpringAuth: boolean;

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private springAuthClient: SpringAuthClientService,
  ) {
    const jwtSecret = configService.get('JWT_SECRET');

    console.log('=== [SpringJwtStrategy] Constructor called ===');
    console.log('[SpringJwtStrategy] JWT Secret length:', jwtSecret?.length || 0);
    console.log('[SpringJwtStrategy] JWT Secret first 10 chars:', jwtSecret?.substring(0, 10));

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: false,
    });

    this.useSpringAuth = this.configService.get('USE_SPRING_AUTH') === 'true';
    console.log('[SpringJwtStrategy] useSpringAuth:', this.useSpringAuth);
    this.logger.log(`SpringJwtStrategy initialized. useSpringAuth: ${this.useSpringAuth}`);
  }

  async validate(payload: any) {
    console.log('=== [SpringJwtStrategy] validate() called ===');
    console.log('[SpringJwtStrategy] payload:', JSON.stringify(payload));

    // For now, just return the payload directly to test if the strategy is working
    // This bypasses all Spring Auth and MongoDB lookups
    return {
      userId: payload.sub,
      email: payload.email,
      externalId: payload.externalId,
      sessionId: payload.sessionId,
      tokenType: payload.type,
      tokenValidatedBy: 'spring-jwt-strategy',
    };
  }
}
