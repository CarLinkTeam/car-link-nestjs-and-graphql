import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/enums/valid-roles.enum';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { Rental } from './entities/rental.entity';

@ApiTags('Rentals')
@ApiBearerAuth()
@Controller('rentals')
@UseGuards(AuthGuard('jwt'))
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}
  @Post()
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  @ApiOperation({ summary: 'Create a new rental' })
  @ApiResponse({
    status: 201,
    description: 'Rental created successfully',
    type: Rental,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid data, vehicle unavailable, or date conflict',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Vehicle or client not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(@GetUser() user: User, @Body() createRentalDto: CreateRentalDto) {
    return this.rentalsService.create(user.id, createRentalDto);
  }
  @Get()
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  @ApiOperation({ summary: 'Get all rentals' })
  @ApiResponse({
    status: 200,
    description: 'List of all rentals retrieved successfully',
    type: [Rental],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll() {
    return this.rentalsService.findAll();
  }

  @Get('user')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  @ApiOperation({ summary: 'Get rentals for the logged-in user' })
  @ApiResponse({
    status: 200,
    description: 'List of rentals for the user retrieved successfully',
    type: [Rental],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findByUser(@GetUser() user: User) {
    return this.rentalsService.findByUser(user.id);
  }

  @Get(':term')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  @ApiOperation({ summary: 'Get a rental by ID or date' })
  @ApiResponse({
    status: 200,
    description: 'Rental found successfully',
    type: Rental,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Rental with specified ID or date not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findOne(@Param('term') term: string) {
    return this.rentalsService.findOne(term);
  }
  @Patch(':id')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  @ApiOperation({ summary: 'Update a rental' })
  @ApiResponse({
    status: 200,
    description: 'Rental updated successfully',
    type: Rental,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid data, vehicle unavailable, or date conflict',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not authorized to update this rental',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Rental, vehicle, or client not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  update(
    @Param('id') id: string,
    @Body() updateRentalDto: UpdateRentalDto,
    @GetUser() user: User,
  ) {
    return this.rentalsService.update(id, updateRentalDto, user.id);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Delete a rental' })
  @ApiResponse({ status: 204, description: 'Rental deleted successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not authorized to delete this rental',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Rental with specified ID not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  remove(@Param('id') id: string) {
    return this.rentalsService.remove(id);
  }
  @Patch(':id/confirm')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Confirm a pending rental' })
  @ApiResponse({
    status: 200,
    description: 'Rental confirmed successfully',
    type: Rental,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Rental not in pending status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not authorized to confirm this rental',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Rental with specified ID not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  confirmRental(@Param('id') id: string) {
    return this.rentalsService.confirmRental(id);
  }
  @Patch(':id/reject')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  @ApiOperation({ summary: 'Reject a pending rental' })
  @ApiResponse({
    status: 200,
    description: 'Rental rejected successfully',
    type: Rental,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Rental not in pending status',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not authorized to reject this rental',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Rental with specified ID not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  rejectRental(@Param('id') id: string) {
    return this.rentalsService.rejectRental(id);
  }
}
