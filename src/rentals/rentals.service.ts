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
import { User } from 'src/users/entities/user.entity';

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

  async findMyRentals(user: User) {
    try {
      return await this.rentalRepository.find({
        where: { client_id: user.id },
        relations: ['client', 'vehicle', 'vehicle.owner'],
        order: { initialDate: 'DESC' },
      });
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findMyOwnerRentals(user: User) {
    try {
      return await this.rentalRepository
        .createQueryBuilder('rental')
        .innerJoinAndSelect('rental.vehicle', 'vehicle')
        .innerJoinAndSelect('rental.client', 'client')
        .where('vehicle.ownerId = :userId', { userId: user.id })
        .orderBy('rental.initialDate', 'DESC')
        .getMany();
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOneRental(id: string, user?: User) {
    try {
      if (!isUUID(id)) {
        throw new BadRequestException('Invalid rental ID format');
      }

      const rental = await this.rentalRepository.findOne({
        where: { id },
        relations: ['client', 'vehicle', 'vehicle.owner'],
      });

      if (!rental) {
        throw new NotFoundException(`Rental with id "${id}" not found`);
      }

      if (user) {
        const hasAccess =
          rental.client_id === user.id ||
          rental.vehicle.ownerId === user.id ||
          user.roles.includes('ADMIN');

        if (!hasAccess) {
          throw new BadRequestException(
            'You do not have access to this rental',
          );
        }
      }

      return rental;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async createRental(user: User, createRentalDto: CreateRentalDto) {
    try {
      const { vehicle_id, initialDate, finalDate, ...rentalData } =
        createRentalDto;

      await this.usersService.findById(user.id);

      await this.vehiclesService.findOne(vehicle_id);

      const startDate = new Date(initialDate);
      const endDate = new Date(finalDate);

      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      if (startDate < new Date()) {
        throw new BadRequestException('Start date cannot be in the past');
      }

      await this.checkVehicleAvailability(vehicle_id, startDate, endDate);

      const rental = this.rentalRepository.create({
        ...rentalData,
        initialDate: startDate,
        finalDate: endDate,
        client_id: user.id,
        vehicle_id,
      });

      const savedRental = await this.rentalRepository.save(rental);

      const unavailability = this.unavailabilityRepository.create({
        vehicle_id,
        unavailable_from: startDate,
        unavailable_to: endDate,
      });

      await this.unavailabilityRepository.save(unavailability);

      return await this.findOneRental(savedRental.id);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async updateRental(id: string, user: User, updateRentalDto: UpdateRentalDto) {
    try {
      const currentRental = await this.findOneRental(id, user);
      if (!currentRental)
        throw new NotFoundException(`Rental with id "${id}" not found`);

      if (
        currentRental.client_id !== user.id &&
        !user.roles.includes('ADMIN')
      ) {
        throw new BadRequestException('You can only update your own rentals');
      }

      if (currentRental.status !== 'pending') {
        throw new BadRequestException('You can only update pending rentals');
      }

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

      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      if (
        updateRentalDto.vehicle_id ||
        updateRentalDto.initialDate ||
        updateRentalDto.finalDate
      ) {
        await this.checkVehicleAvailability(vehicleId, startDate, endDate, id);
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.manager.update(Rental, id, {
          ...updateRentalDto,
        });

        if (
          updateRentalDto.vehicle_id ||
          updateRentalDto.initialDate ||
          updateRentalDto.finalDate
        ) {
          await queryRunner.manager.delete(VehicleUnavailability, {
            vehicle_id: currentRental.vehicle_id,
            unavailable_from: currentRental.initialDate,
            unavailable_to: currentRental.finalDate,
          });

          const newUnavailability = this.unavailabilityRepository.create({
            vehicle_id: vehicleId,
            unavailable_from: startDate,
            unavailable_to: endDate,
          });
          await queryRunner.manager.save(newUnavailability);
        }

        await queryRunner.commitTransaction();
        await queryRunner.release();

        return await this.findOneRental(id);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw error;
      }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async confirmRental(id: string, user: User) {
    try {
      const rental = await this.findOneRental(id);
      if (!rental)
        throw new NotFoundException(`Rental with id "${id}" not found`);

      if (rental.vehicle.ownerId !== user.id && !user.roles.includes('ADMIN')) {
        throw new BadRequestException(
          'Only the vehicle owner can confirm rentals',
        );
      }

      if (rental.status !== 'pending') {
        throw new BadRequestException('Only pending rentals can be confirmed');
      }

      await this.rentalRepository.update(id, { status: 'confirmed' });

      const updatedRental = await this.findOneRental(id);
      return {
        message: 'Rental confirmed successfully',
        rental: updatedRental,
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async rejectRental(id: string, user: User) {
    try {
      const rental = await this.findOneRental(id);
      if (!rental)
        throw new NotFoundException(`Rental with id "${id}" not found`);

      if (rental.vehicle.ownerId !== user.id && !user.roles.includes('ADMIN')) {
        throw new BadRequestException(
          'Only the vehicle owner can reject rentals',
        );
      }

      if (rental.status !== 'pending') {
        throw new BadRequestException('Only pending rentals can be rejected');
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.manager.update(Rental, id, { status: 'cancelled' });

        await queryRunner.manager.delete(VehicleUnavailability, {
          vehicle_id: rental.vehicle_id,
          unavailable_from: rental.initialDate,
          unavailable_to: rental.finalDate,
        });

        await queryRunner.commitTransaction();
        await queryRunner.release();

        const updatedRental = await this.findOneRental(id);
        return {
          message: 'Rental rejected successfully',
          rental: updatedRental,
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw error;
      }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async deleteRental(id: string, user: User) {
    try {
      const rental = await this.findOneRental(id);
      if (!rental)
        throw new NotFoundException(`Rental with id "${id}" not found`);

      if (!user.roles.includes('ADMIN')) {
        throw new BadRequestException('Only administrators can delete rentals');
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.manager.delete(VehicleUnavailability, {
          vehicle_id: rental.vehicle_id,
          unavailable_from: rental.initialDate,
          unavailable_to: rental.finalDate,
        });

        await queryRunner.manager.remove(rental);

        await queryRunner.commitTransaction();
        await queryRunner.release();

        return true;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw error;
      }
    } catch (error) {
      this.handleExceptions(error);
      return false;
    }
  }

  private async checkVehicleAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeRentalId?: string,
  ) {
    const unavailabilityQuery = this.unavailabilityRepository
      .createQueryBuilder('unavailability')
      .where('unavailability.vehicle_id = :vehicleId', { vehicleId })
      .andWhere(
        `(
          (unavailability.unavailable_from <= :startDate AND unavailability.unavailable_to >= :startDate) OR
          (unavailability.unavailable_from <= :endDate AND unavailability.unavailable_to >= :endDate) OR
          (unavailability.unavailable_from >= :startDate AND unavailability.unavailable_to <= :endDate)
        )`,
        { startDate, endDate },
      );

    if (excludeRentalId) {
      const currentRental = await this.rentalRepository.findOne({
        where: { id: excludeRentalId },
      });
      
      if (currentRental) {
        unavailabilityQuery.andWhere(
          `NOT (unavailability.unavailable_from = :currentStart AND unavailability.unavailable_to = :currentEnd)`,
          { 
            currentStart: currentRental.initialDate,
            currentEnd: currentRental.finalDate 
          },
        );
      }
    }

    const unavailabilityConflicts = await unavailabilityQuery.getCount();

    if (unavailabilityConflicts > 0) {
      throw new BadRequestException(
        'Vehicle is not available during this period',
      );
    }

    const rentalConflictsQuery = this.rentalRepository
      .createQueryBuilder('rental')
      .where('rental.vehicle_id = :vehicleId', { vehicleId })
      .andWhere('rental.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: ['cancelled'],
      })
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
        'Vehicle is already rented during this period',
      );
    }

    return true;
  }

  private handleExceptions(error: any) {
    if (error instanceof BadRequestException) throw error;
    if (error instanceof NotFoundException) throw error;
    if (error.code === '23505') throw new BadGatewayException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
