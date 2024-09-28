import {Module} from "@nestjs/common";
import {UsersModule} from "../users/users.module";
import {PassportModule} from "@nestjs/passport";
import {AuthService} from "./auth.service";
import {AuthController} from "./auth.controller";
import {JwtModule} from "@nestjs/jwt";

@Module({
    imports: [
        UsersModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '7d' }
        })
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [
        UsersModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '7d' }
        })
    ]

})
export class AuthModule {}