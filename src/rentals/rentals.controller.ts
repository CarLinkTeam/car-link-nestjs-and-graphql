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

@Controller('rentals')
export class RentalsController {
  constructor(private readonly rentalsService: RentalsService) {}

  @Post()
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  create(@Body() createRentalDto: CreateRentalDto) {
    return this.rentalsService.create(createRentalDto);
  }

  @Get()
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  findAll() {
    return this.rentalsService.findAll();
  }

  @Get(':term')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN, ValidRoles.TENANT)
  findOne(@Param('term') term: string) {
    return this.rentalsService.findOne(term);
  }

  @Patch(':id')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  update(@Param('id') id: string, @Body() updateRentalDto: UpdateRentalDto) {
    return this.rentalsService.update(id, updateRentalDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  remove(@Param('id') id: string) {
    return this.rentalsService.remove(id);
  }

  @Patch(':id/confirm')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  confirmRental(@Param('id') id: string) {
    return this.rentalsService.confirmRental(id);
  }

  @Patch(':id/reject')
  @Auth(ValidRoles.OWNER, ValidRoles.ADMIN)
  rejectRental(@Param('id') id: string) {
    return this.rentalsService.rejectRental(id);
  }
}
