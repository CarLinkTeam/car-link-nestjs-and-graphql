import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ValidRoles } from '../enums/valid-roles.enum';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { GqlAuthGuard } from '../guards/user-role/gql-auth.guard';

export function Auth(...roles: ValidRoles[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(GqlAuthGuard, UserRoleGuard)
  );
}