import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { DataSource, Repository, Between } from 'typeorm';
import { isUUID } from 'class-validator';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';

@Injectable()
export class RentalsService {
  private logger = new Logger('RentalsService');
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(VehicleUnavailability)
    private readonly unavailabilityRepository: Repository<VehicleUnavailability>,
    private readonly usersService: UsersService,
    private readonly vehiclesService: VehiclesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(client_id: string, createRentalDto: CreateRentalDto) {
    try {
      const { vehicle_id, initialDate, finalDate, ...rentalData } =
        createRentalDto;
      await this.usersService.findById(client_id);

      await this.vehiclesService.findOne(vehicle_id);

      const startDate = new Date(initialDate);
      const endDate = new Date(finalDate);

      if (startDate >= endDate) {
        throw new BadRequestException(
          'La fecha inicial debe ser anterior a la fecha final',
        );
      }

      await this.checkVehicleAvailability(vehicle_id, startDate, endDate);

      const rental = this.rentalRepository.create({
        ...rentalData,
        initialDate: startDate,
        finalDate: endDate,
        client_id,
        vehicle_id,
      });

      await this.rentalRepository.save(rental);

      // Registrar los días inhabilitados en VehicleUnavailability
      const unavailability = this.unavailabilityRepository.create({
        vehicle_id,
        unavailable_from: startDate,
        unavailable_to: endDate,
      });

      await this.unavailabilityRepository.save(unavailability);

      return rental;
    } catch (error) {
      return this.handleExeptions(error);
    }
  }

  async findAll() {
    try {
      return await this.rentalRepository.find({
        relations: ['client', 'vehicle'],
      });
    } catch (error) {
      this.handleExeptions(error);
    }
  }

  async findOne(term: string) {
    let rental: Rental | null;

    if (isUUID(term)) {
      rental = await this.rentalRepository.findOne({
        where: { id: term },
        relations: ['client', 'vehicle'],
      });
    } else {
      const searchDate = new Date(term);

      if (!isNaN(searchDate.getTime())) {
        const queryBuilder = this.rentalRepository.createQueryBuilder('rental');
        rental = await queryBuilder
          .where('DATE(rental.initialDate) = DATE(:searchDate)', { searchDate })
          .orWhere('DATE(rental.finalDate) = DATE(:searchDate)', { searchDate })
          .leftJoinAndSelect('rental.client', 'client')
          .leftJoinAndSelect('rental.vehicle', 'vehicle')
          .getOne();
      } else {
        rental = null;
      }
    }

    if (!rental) {
      throw new NotFoundException(`Rental with id or date "${term}" not found`);
    }

    return rental;
  }

  async update(
    id: string,
    updateRentalDto: UpdateRentalDto,
    client_id: string,
  ) {
    if (updateRentalDto.vehicle_id) {
      await this.vehiclesService.findOne(updateRentalDto.vehicle_id);
    }

    const currentRental = await this.findOne(id);
    let startDate = currentRental.initialDate;
    let endDate = currentRental.finalDate;
    let vehicleId = currentRental.vehicle_id;

    if (updateRentalDto.initialDate) {
      startDate = new Date(updateRentalDto.initialDate);
    }

    if (updateRentalDto.finalDate) {
      endDate = new Date(updateRentalDto.finalDate);
    }

    if (updateRentalDto.vehicle_id) {
      vehicleId = updateRentalDto.vehicle_id;
    }

    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha inicial debe ser anterior a la fecha final',
      );
    }

    if (
      updateRentalDto.vehicle_id ||
      updateRentalDto.initialDate ||
      updateRentalDto.finalDate
    ) {
      await this.checkVehicleAvailability(vehicleId, startDate, endDate, id);
    }

    const { ...rentalData } = updateRentalDto;

    const rental = await this.rentalRepository.preload({
      id: id,
      ...rentalData,
      client_id,
    });

    if (!rental)
      throw new NotFoundException(`Rental with id "${id}" not found`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.save(rental);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExeptions(error);
    }
  }

  async remove(id: string) {
    const rental = await this.findOne(id);
    if (!rental)
      throw new NotFoundException(`Rental with id "${id}" not found`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.remove(rental);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExeptions(error);
    }
  }

  private async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string,
  ) {
    const unavailabilityConflicts = await this.unavailabilityRepository.find({
      where: {
        vehicle_id: vehicleId,
        unavailable_from: Between(startDate, endDate),
      },
    });

    if (unavailabilityConflicts.length > 0) {
      throw new BadRequestException(
        'The vehicle is not available during this period',
      );
    }

    const rentalConflictsQuery = this.rentalRepository
      .createQueryBuilder('rental')
      .where('rental.vehicle_id = :vehicleId', { vehicleId })
      .andWhere(
        `(
          (rental.initialDate <= :startDate AND rental.finalDate >= :startDate) OR
          (rental.initialDate <= :endDate AND rental.finalDate >= :endDate) OR
          (rental.initialDate >= :startDate AND rental.finalDate <= :endDate)
        )`,
        { startDate, endDate },
      );

    if (excludeRentalId) {
      rentalConflictsQuery.andWhere('rental.id != :excludeRentalId', {
        excludeRentalId,
      });
    }

    const rentalConflicts = await rentalConflictsQuery.getCount();

    if (rentalConflicts > 0) {
      throw new BadRequestException(
        'The vehicle is already reserved in that period',
      );
    }

    return true;
  }

  private handleExeptions(error: any) {
    if (error instanceof BadRequestException) throw error;
    if (error instanceof NotFoundException) throw error;
    if (error.code === '23505') throw new BadGatewayException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }

  async confirmRental(id: string) {
    const rental = await this.findOne(id);

    if (rental.status !== 'pending') {
      throw new BadRequestException(
        'Only rents in pending status can be confirmed',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      rental.status = 'confirmed';
      await queryRunner.manager.save(rental);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExeptions(error);
    }
  }

  async rejectRental(id: string) {
    const rental = await this.findOne(id);

    if (rental.status !== 'pending') {
      throw new BadRequestException(
        'Only rents in pending status can be rejected',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      rental.status = 'canceled';
      await queryRunner.manager.save(rental);
      await queryRunner.commitTransaction();
      await queryRunner.release();

      return await this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleExeptions(error);
    }
  }
}
