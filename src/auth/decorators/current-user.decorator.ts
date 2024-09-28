import { ExecutionContext, UnauthorizedException, createParamDecorator } from "@nestjs/common";
import { User } from "src/users/models/user.model";

export const CurrentUser = createParamDecorator((data: never, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest();
    if (!request.user)
        throw new UnauthorizedException();

    return request.user;
});