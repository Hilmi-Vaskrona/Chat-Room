import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class CurrentUserPayload {
  id: string;
  username: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
