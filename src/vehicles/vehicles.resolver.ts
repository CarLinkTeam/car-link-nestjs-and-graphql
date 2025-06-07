import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { VehicleResponse, VehiclesResponse } from './types/vehicles-response';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { User } from 'src/users/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GqlAuthGuard } from 'src/auth/guards/user-role/gql-auth.guard';
import { UserRoleGuard } from 'src/auth/guards/user-role/user-role.guard';
import { UseGuards } from '@nestjs/common';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { Auth } from 'src/auth/decorators/auth.decorator';

@UseGuards(GqlAuthGuard, UserRoleGuard)
@Resolver()
export class VehicleResolver {
  constructor(private readonly vehiclesService: VehiclesService) { }

  @Auth(ValidRoles.OWNER,ValidRoles.ADMIN)
  @Mutation(() => VehicleResponse, { name: 'create' })
  async create(
    @Args('createInput') createInput: CreateVehicleDto,
    @GetUser() user: User
  ): Promise<VehicleResponse> {
    const vehicle = await this.vehiclesService.create(user.id, createInput);
    if (!vehicle) throw new Error('Vehicle creation failed');
    return { vehicle };
  }

  @Auth(ValidRoles.OWNER,ValidRoles.ADMIN)
  @Query(() => VehiclesResponse, { name: 'findMyVehicles' })
  async findMyVehicles(@GetUser() user: User): Promise<VehiclesResponse> {
    const vehicles = await this.vehiclesService.findByOwner(user.id);
    if (!vehicles || vehicles.length === 0) throw new Error('No vehicles found for this user');
    return { vehicles };
  }

  @Auth(ValidRoles.OWNER,ValidRoles.ADMIN)
  @Query(() => VehicleResponse, { name: 'findMyVehicle' })
  async findMyVehicle(
    @Args('id') id: string,
    @GetUser() user: User): Promise<VehicleResponse> {
    const vehicle = await this.vehiclesService.findVehicleByOwner(id, user.id);
    if (!vehicle) throw new Error('No vehicle found for this user');
    return { vehicle };
  }

  @Auth(ValidRoles.OWNER,ValidRoles.ADMIN)
  @Mutation(() => VehicleResponse, { name: 'update' })
  async update(
    @Args('updateInput') createInput: UpdateVehicleDto,
    @Args('id') id: string,
    @GetUser() user: User,
    @GetUser() requester: User
  ): Promise<VehicleResponse> {
    const vehicle = await this.vehiclesService.update(id, user.id, createInput, requester);
    if (!vehicle) throw new Error('Vehicle creation failed');
    return { vehicle };
  }

  @Auth(ValidRoles.OWNER,ValidRoles.ADMIN)
  @Mutation(() => Boolean, { name: 'deleteVehicle' })
  async deleteVehicle(
    @Args('id') id: string,
    @GetUser() requester: User,
  ): Promise<boolean> {
    try {
      await this.vehiclesService.remove(id, requester.id, requester);
      return true;
    } catch (error) {
      throw error;
    }
  }
}