import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { GqlAuthGuard } from 'src/auth/guards/user-role/gql-auth.guard';
import { UserRoleGuard } from 'src/auth/guards/user-role/user-role.guard';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { Auth } from 'src/auth/decorators/auth.decorator';
import {
  RentalResponse,
  RentalsResponse,
  RentalStatusResponse,
} from './types/rentals-response';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { RentalsService } from './rentals.service';

@UseGuards(GqlAuthGuard, UserRoleGuard)
@Resolver()
export class RentalsResolver {
  constructor(private readonly rentalsService: RentalsService) {}

  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  @Query(() => RentalsResponse, {
    name: 'findMyRentals',
    description: 'Get all rentals for the authenticated user as a client',
  })
  async findMyRentals(@GetUser() user: User): Promise<RentalsResponse> {
    const rentals = await this.rentalsService.findMyRentals(user);
    return { rentals: rentals || [] };
  }

  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  @Query(() => RentalsResponse, {
    name: 'findMyOwnerRentals',
    description: 'Get all rentals for vehicles owned by the authenticated user',
  })
  async findMyOwnerRentals(@GetUser() user: User): Promise<RentalsResponse> {
    const rentals = await this.rentalsService.findMyOwnerRentals(user);
    return { rentals: rentals || [] };
  }

  @Auth(ValidRoles.TENANT, ValidRoles.OWNER, ValidRoles.ADMIN)
  @Query(() => RentalResponse, {
    name: 'findOneRental',
    description: 'Get a specific rental by ID',
  })
  async findOneRental(
    @Args('id', { description: 'Rental ID' }) id: string,
    @GetUser() user: User,
  ): Promise<RentalResponse> {
    const rental = await this.rentalsService.findOneRental(id, user);
    if (!rental) throw new Error('Rental not found');
    return { rental };
  }

  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  @Mutation(() => RentalResponse, {
    name: 'createRental',
    description: 'Create a new rental request',
  })
  async createRental(
    @Args('createInput', { description: 'Rental data' })
    createInput: CreateRentalDto,
    @GetUser() user: User,
  ): Promise<RentalResponse> {
    const rental = await this.rentalsService.createRental(user, createInput);
    if (!rental) throw new Error('Rental creation failed');
    return { rental };
  }

  @Auth(ValidRoles.TENANT, ValidRoles.ADMIN)
  @Mutation(() => RentalResponse, {
    name: 'updateRental',
    description: 'Update an existing rental (only pending rentals)',
  })
  async updateRental(
    @Args('id', { description: 'Rental ID' }) id: string,
    @Args('updateInput', { description: 'Updated rental data' })
    updateInput: UpdateRentalDto,
    @GetUser() user: User,
  ): Promise<RentalResponse> {
    const rental = await this.rentalsService.updateRental(
      id,
      user,
      updateInput,
    );
    if (!rental) throw new Error('Rental update failed');
    return { rental };
  }

  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  @Mutation(() => RentalStatusResponse, {
    name: 'confirmRental',
    description: 'Confirm a pending rental (vehicle owners only)',
  })
  async confirmRental(
    @Args('id', { description: 'Rental ID' }) id: string,
    @GetUser() user: User,
  ): Promise<RentalStatusResponse> {
    const result = await this.rentalsService.confirmRental(id, user);
    if (!result || !result.rental)
      throw new Error('Rental confirmation failed');
    return { message: result.message, rental: result.rental };
  }

  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  @Mutation(() => RentalStatusResponse, {
    name: 'rejectRental',
    description: 'Reject a pending rental (vehicle owners only)',
  })
  async rejectRental(
    @Args('id', { description: 'Rental ID' }) id: string,
    @GetUser() user: User,
  ): Promise<RentalStatusResponse> {
    const result = await this.rentalsService.rejectRental(id, user);
    if (!result || !result.rental) throw new Error('Rental rejection failed');
    return { message: result.message, rental: result.rental };
  }

  @Auth(ValidRoles.ADMIN)
  @Mutation(() => Boolean, {
    name: 'deleteRental',
    description: 'Delete a rental (administrators only)',
  })
  async deleteRental(
    @Args('id', { description: 'Rental ID' }) id: string,
    @GetUser() user: User,
  ): Promise<boolean> {
    return await this.rentalsService.deleteRental(id, user);
  }
}
