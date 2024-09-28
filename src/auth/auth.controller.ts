import {Body, Controller, Post, Get, Request, UseGuards} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "src/auth/dtos/RegisterDto";
import { LoginDto } from "./dtos/LoginDto";
import { AuthGuard } from "./guards/auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { User } from "src/users/models/user.model";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@CurrentUser() user: User) {
    return user;
  }
}
