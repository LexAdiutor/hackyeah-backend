import { BadGatewayException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from 'src/auth/dtos/RegisterDto';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dtos/LoginDto';
import {JwtService} from "@nestjs/jwt";
import {User} from "../users/models/user.model";
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
      private readonly usersService: UsersService,
      private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user)
      return null;
    const salt = user.password.split('.')[0] ?? '';
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    return user.password === `${salt}.${hash.toString('hex')}` ? user : null;
  }

  async getPayload(user: User) {
    return {
      access_token: await this.jwtService.signAsync({email: user.email, sub: user._id}, {secret: process.env.JWT_SECRET})
    };
  }

  async register(body: RegisterDto) {
    const users = await this.usersService.findByEmail(body.email);

    if (users)
      throw new ConflictException('User with this email already exists');

    const salt = randomBytes(32).toString('hex');
    const hash = (await scrypt(body.password, salt, 32)) as Buffer;

    const user = await this.usersService.create(body.name, body.email, `${salt}.${hash.toString('hex')}`);
    
    return this.getPayload(user);
  }

  async login(body: LoginDto) {
    const user = await this.validateUser(body.email, body.password);

    if (!user)
      throw new UnauthorizedException('Invalid credentials');

    return this.getPayload(user);
  }
}
