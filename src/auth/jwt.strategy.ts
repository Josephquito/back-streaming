//src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const options = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'Ellayyo.123',
    };

    super(options);
  }

  validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      id: payload.sub,
      rol: payload.rol,
      negocioId: payload.negocioId ?? null, // <--- este es el correcto
    };
  }
}
