import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = AuthGuard.extractTokenFromHeader(request);

        if (!token)
            throw new UnauthorizedException();

        try {
            const payload = await this.jwtService.verifyAsync(token, {secret: process.env.JWT_SECRET});

            request.user = await this.usersService.findById(payload.sub);
        } catch {
            throw new UnauthorizedException();
        }

        return true;
    }

    static extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = (request.headers.authorization ?? '').split(' ');
        
        return type === 'Bearer' ? token : undefined;
    }
}