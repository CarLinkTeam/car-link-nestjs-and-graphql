import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/enums/valid-roles.enum';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Vehicle } from './entities/vehicle.entity';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Auth(ValidRoles.OWNER)
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle created successfully',
    type: Vehicle,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid vehicle data or license plate already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not an owner' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(
    @GetUser() user: User,
    @Body() createVehicleDto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(user.id, createVehicleDto);
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.OWNER, ValidRoles.TENANT)
  @ApiOperation({ summary: 'Get all vehicles' })
  @ApiResponse({
    status: 200,
    description: 'List of vehicles retrieved successfully',
    type: [Vehicle],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({ status: 404, description: 'Not found - No vehicles found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll() {
    return this.vehiclesService.findAll();
  }

  @Get('myVehicles')
  @Auth(ValidRoles.OWNER)
  @ApiOperation({ summary: 'Get all vehicles owned by the authenticated user' })
  @ApiResponse({
    status: 200,
    description: "List of user's vehicles retrieved successfully",
    type: [Vehicle],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not an owner' })
  @ApiResponse({
    status: 404,
    description: 'Not found - No vehicles found for this owner',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findMyVehicles(@GetUser() user: User) {
    return this.vehiclesService.findByOwner(user.id);
  }

  @Get(':term')
  @Auth(ValidRoles.ADMIN, ValidRoles.OWNER, ValidRoles.TENANT)
  @ApiOperation({ summary: 'Get a vehicle by ID or license plate' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle found successfully',
    type: Vehicle,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Vehicle with specified term not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('term') term: string) {
    return this.vehiclesService.findOne(term);
  }

  @Patch(':id')
  @Auth(ValidRoles.OWNER)
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle updated successfully',
    type: Vehicle,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid vehicle data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not the owner of this vehicle',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Vehicle with specified ID not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, user.id, updateVehicleDto);
  }

  @Delete(':id')
  @Auth(ValidRoles.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a vehicle' })
  @ApiResponse({ status: 204, description: 'Vehicle deleted successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not the owner of this vehicle',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Vehicle with specified ID not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.vehiclesService.remove(id, user.id);
  }
}
