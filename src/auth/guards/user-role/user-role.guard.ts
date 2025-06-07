import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from '../../decorators/role-protected/role-protected.decorator';
import { User } from '../../../users/entities/user.entity';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(private readonly reflector: Reflector){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const validRoles: string[] = this.reflector.get(META_ROLES,
      context.getHandler()
    )

    if(!validRoles) return true;

    if(validRoles.length === 0) return true;

    const isGraphQL = context.getType<'graphql' | 'http'>() === 'graphql';
    const req = isGraphQL
      ? GqlExecutionContext.create(context).getContext().req
      : context.switchToHttp().getRequest();
      
    const user = req.user as User;

    if(!user) throw new BadRequestException(`User not found`);

    const hasValidRole = user.roles.some(role => validRoles.includes(role));

    if(hasValidRole) return true;

    throw new ForbiddenException(`User ${user.email} needs a valid role`);
    
  }
}