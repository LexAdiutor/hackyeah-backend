import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from "class-validator";

export class RegisterDto {
    @IsEmail()
    email: string;
    @IsString()
    @IsNotEmpty()
    name: string;
    @IsStrongPassword()
    password: string;
}