import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get('JWT_SECRET');

    console.log('[JwtStrategy] Constructor called');
    console.log('[JwtStrategy] JWT Secret length:', jwtSecret?.length || 0);
    console.log('[JwtStrategy] JWT Secret first 10 chars:', jwtSecret?.substring(0, 10));

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] validate called with payload:', JSON.stringify(payload));

    // Check if payload.sub is a valid MongoDB ObjectId
    // Spring auth-service uses UUIDs, while gateway MongoDB uses ObjectIds
    const isMongoId = Types.ObjectId.isValid(payload.sub) &&
                      new Types.ObjectId(payload.sub).toString() === payload.sub;

    if (!isMongoId) {
      // This is likely a Spring auth-service token with UUID subject
      console.log('[JwtStrategy] Subject is not a MongoDB ObjectId, using payload data');
      return {
        userId: payload.sub,
        email: payload.email,
        externalId: payload.externalId,
        sessionId: payload.sessionId,
        tokenType: payload.type,
        tokenValidatedBy: 'jwt-strategy-payload',
      };
    }

    // Try to find user in MongoDB
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      // If user not in MongoDB, return payload data
      console.log('[JwtStrategy] User not found in MongoDB, using payload data');
      return {
        userId: payload.sub,
        email: payload.email,
        externalId: payload.externalId,
        sessionId: payload.sessionId,
        tokenType: payload.type,
        tokenValidatedBy: 'jwt-strategy-payload',
      };
    }

    // Return the full user object for admin guards to check role/permissions
    return {
      _id: user._id.toString(),
      userId: payload.sub,
      phoneNumber: payload.phoneNumber,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isBanned: user.isBanned,
      isActive: user.isActive,
      tokenValidatedBy: 'jwt-strategy-mongodb',
    };
  }
}
