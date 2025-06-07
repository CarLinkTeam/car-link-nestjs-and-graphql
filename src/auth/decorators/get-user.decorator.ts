import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const GetUser = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(context);
    const gqlReq = gqlCtx.getContext()?.req;

    const req = gqlReq ?? context.switchToHttp().getRequest();

    if (!req) throw new InternalServerErrorException('Request not found in context');

    const user = req.user;

    if (!user) throw new InternalServerErrorException('User not found');

    return data ? user[data] : user;
  },
);
