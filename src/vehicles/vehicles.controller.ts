import { Controller, Get, Post, Body, Param, Delete, Put, HttpCode, HttpStatus } from "@nestjs/common"
import { VehiclesService } from "./vehicles.service"
import { CreateVehicleDto } from "./dto/create-vehicle.dto"
import { UpdateVehicleDto } from "./dto/update-vehicle.dto"
import { Auth } from "../auth/decorators/auth.decorator"
import { ValidRoles } from "../auth/enums/valid-roles.enum"
import { GetUser } from "../auth/decorators/get-user.decorator"
import { User } from "../users/entities/user.entity"
import { VehicleResponseDto } from "./dto/vehicle-response.dto"

@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Auth(ValidRoles.OWNER)
  async create(
    @GetUser() user: User,
    @Body() createVehicleDto: CreateVehicleDto
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.create(user.id, createVehicleDto)
  }

  @Get()
  @Auth(ValidRoles.ADMIN, ValidRoles.OWNER, ValidRoles.TENANT)
  async findAll(): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.findAll()
  }

  @Get('myVehicles')
  @Auth(ValidRoles.OWNER)
  async findMyVehicles(@GetUser() user: User): Promise<VehicleResponseDto[]> {
    return this.vehiclesService.findByOwner(user.id);
  }

  @Get(':id')
  @Auth(ValidRoles.ADMIN, ValidRoles.OWNER, ValidRoles.TENANT)
  async findOne(@Param('id') id: string): Promise<VehicleResponseDto> {
    return this.vehiclesService.findOne(id);
  }

  @Get('license/:licensePlate')
  @Auth(ValidRoles.ADMIN, ValidRoles.OWNER, ValidRoles.TENANT)
  async findByLicensePlate(@Param('licensePlate') licensePlate: string): Promise<VehicleResponseDto> {
    return this.vehiclesService.findByLicensePlate(licensePlate);
  }

  @Put(":id")
  @Auth(ValidRoles.OWNER)
  async update(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.update(id, user.id, updateVehicleDto)
  }

  @Delete(":id")
  @Auth(ValidRoles.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @GetUser() user: User): Promise<void> {
    return this.vehiclesService.remove(id, user.id)
  }
}
