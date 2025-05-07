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
} from '@nestjs/common';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ValidRoles } from '../auth/enums/valid-roles.enum';
import { ApiTags, ApiResponse } from '@nestjs/swagger';

@ApiTags('Rentals')
@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  @ApiResponse({ status: 201, description: 'Rental created successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid data, vehicle unavailable, or date conflict',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Vehicle or client not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  create(@Body() createRentalDto: CreateRentalDto) {
    return this.rentalsService.create(createRentalDto);
  }

  @Get()
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  @ApiResponse({
    status: 200,
    description: 'List of all rentals retrieved successfully',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findAll() {
    return this.rentalsService.findAll();
  }

  @Get(':term')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  @ApiResponse({ status: 200, description: 'Rental found successfully' })
  @ApiResponse({
    status: 404,
    description: 'Not found - Rental with specified ID or date not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  findOne(@Param('term') term: string) {
    return this.rentalsService.findOne(term);
  }

  @Patch(':id')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  @ApiResponse({ status: 200, description: 'Rental updated successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid data, vehicle unavailable, or date conflict',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Rental, vehicle, or client not found',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  update(@Param('id') id: string, @Body() updateRentalDto: UpdateRentalDto) {
    return this.rentalsService.update(id, updateRentalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  @ApiResponse({ status: 204, description: 'Rental deleted successfully' })
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
  @ApiResponse({ status: 200, description: 'Rental confirmed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Rental not in pending status',
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
  @ApiResponse({ status: 200, description: 'Rental rejected successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Rental not in pending status',
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
