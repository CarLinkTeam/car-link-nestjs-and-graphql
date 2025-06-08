import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { GqlAuthGuard } from '../auth/guards/user-role/gql-auth.guard';
import { UserRoleGuard } from '../auth/guards/user-role/user-role.guard';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/enums/valid-roles.enum';
import {
  UserResponse,
  UsersResponse,
  UserDeleteResponse,
} from './types/users-response';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Auth(ValidRoles.ADMIN)
  @Query(() => UsersResponse, {
    name: 'findAllUsers',
    description: 'Get all active users in the system (Admin only)',
  })
  async findAllUsers(): Promise<UsersResponse> {
    const users = await this.usersService.findAll();
    return { users };
  }

  @Auth(ValidRoles.ADMIN)
  @Query(() => UserResponse, {
    name: 'findUserById',
    description: 'Get a specific user by ID (Admin only)',
  })
  async findUserById(
    @Args('id', { description: 'User ID to retrieve' }) id: string,
  ): Promise<UserResponse> {
    const user = await this.usersService.findById(id);
    if (!user) throw new Error('User not found');
    return { user };
  }

  @Auth(ValidRoles.ADMIN, ValidRoles.OWNER, ValidRoles.TENANT)
  @Query(() => UserResponse, {
    name: 'getMyProfile',
    description: 'Get the authenticated user profile',
  })
  async getMyProfile(@GetUser() user: User): Promise<UserResponse> {
    const userProfile = await this.usersService.findById(user.id);
    if (!userProfile) throw new Error('User profile not found');
    return { user: userProfile };
  }

  @Auth(ValidRoles.ADMIN)
  @Mutation(() => UserResponse, {
    name: 'updateUser',
    description: 'Update any user information (Admin only)',
  })
  async updateUser(
    @Args('id', { description: 'User ID to update' }) id: string,
    @Args('updateInput', { description: 'User update data' })
    updateInput: UpdateUserDto,
    @GetUser() requester: User,
  ): Promise<UserResponse> {
    const user = await this.usersService.update(id, updateInput, requester);
    if (!user) throw new Error('User update failed');
    return { user };
  }

  @Auth(ValidRoles.ADMIN, ValidRoles.OWNER, ValidRoles.TENANT)
  @Mutation(() => UserResponse, {
    name: 'updateMyProfile',
    description: 'Update the authenticated user profile',
  })
  async updateMyProfile(
    @Args('updateInput', { description: 'Profile update data' })
    updateInput: UpdateUserDto,
    @GetUser() requester: User,
  ): Promise<UserResponse> {
    const user = await this.usersService.update(
      requester.id,
      updateInput,
      requester,
    );
    if (!user) throw new Error('Profile update failed');
    return { user };
  }

  @Auth(ValidRoles.ADMIN)
  @Mutation(() => UserDeleteResponse, {
    name: 'deleteUser',
    description: 'Deactivate any user account (Admin only)',
  })
  async deleteUser(
    @Args('id', { description: 'User ID to delete' }) id: string,
    @GetUser() requester: User,
  ): Promise<UserDeleteResponse> {
    const result = await this.usersService.remove(id, requester);
    return {
      message: result.message,
      success: true,
    };
  }

  @Auth(ValidRoles.ADMIN, ValidRoles.OWNER, ValidRoles.TENANT)
  @Mutation(() => UserDeleteResponse, {
    name: 'deleteMyAccount',
    description: 'Deactivate the authenticated user account',
  })
  async deleteMyAccount(
    @GetUser() requester: User,
  ): Promise<UserDeleteResponse> {
    const result = await this.usersService.remove(requester.id, requester);
    return {
      message: result.message,
      success: true,
    };
  }
}
