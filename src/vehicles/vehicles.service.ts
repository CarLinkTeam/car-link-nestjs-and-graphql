import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleUnavailability } from './entities/vehicle-unavailability.entity';
import { isUUID } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { ValidRoles } from 'src/auth/enums/valid-roles.enum';
import { request } from 'http';

@Injectable()
export class VehiclesService {
  private readonly API_URL = 'https://api.api-ninjas.com/v1/cars';
  private readonly logger = new Logger('VehiclesService');
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(VehicleUnavailability)
    private vehicleUnavailabilityRepository: Repository<VehicleUnavailability>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) { }

  async create(ownerId: string, createVehicleDto: CreateVehicleDto) {
    try {
      const existingVehicle = await this.vehicleRepository.findOne({
        where: { license_plate: createVehicleDto.license_plate },
      });

      if (existingVehicle) {
        throw new BadRequestException(
          'Vehicle with this license plate already exists',
        );
      }

      const apiData = await this.fetchVehicleDataFromAPI(
        createVehicleDto.make,
        createVehicleDto.vehicleModel,
        createVehicleDto.year,
      );

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const newVehicle = this.vehicleRepository.create({
          ...createVehicleDto,
          ownerId,
          ...apiData,
        });

        const savedVehicle = await queryRunner.manager.save(newVehicle);
        await queryRunner.commitTransaction();
        await queryRunner.release();

        return savedVehicle;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw error;
      }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll() {
    try {
      const vehicles = await this.vehicleRepository.find({
        relations: ['owner'],
      });

      if (!vehicles.length) {
        throw new NotFoundException('Vehicles not found');
      }

      return vehicles;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(term: string) {
    try {
      let vehicle: Vehicle | null;

      if (isUUID(term)) {
        vehicle = await this.vehicleRepository.findOne({
          where: { id: term },
          relations: ['owner'],
        });
      } else {
        vehicle = await this.vehicleRepository.findOne({
          where: { license_plate: term },
          relations: ['owner'],
        });
      }

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with id or license plate "${term}" not found`,
        );
      }

      return vehicle;
    } catch (error) {
      this.handleExceptions(error);
    }
  }
async findByOwner(user: User) {
  try {
    const isAdmin = user.roles.includes(ValidRoles.ADMIN);

    const whereClause = isAdmin
      ? {} 
      : { ownerId: user.id }; 

    const vehicles = await this.vehicleRepository.find({
      where: whereClause,
      relations: ['owner'],
    });

    if (!vehicles.length) {
      throw new NotFoundException(
        isAdmin
          ? 'No vehicles found in the system'
          : `No vehicles found for owner with id "${user.id}"`,
      );
    }

    return vehicles;
  } catch (error) {
    this.handleExceptions(error);
  }
}


  async findVehicleByOwner(vehicleId: string, user: User) {
    const isAdmin = user.roles.includes(ValidRoles.ADMIN);

    const vehicle = await this.vehicleRepository.findOne({
      where: {
        id: vehicleId,
        ...(isAdmin ? {} : { ownerId: user.id }),
      },
      relations: ['owner'],
    });

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with id "${vehicleId}"${isAdmin ? '' : ` for owner with id "${user.id}"`} not found`,
      );
    }

    return vehicle;
  }



  async findVehicleUnavailability(vehicleId: string) {
    try {
      // First verify that the vehicle exists
      await this.findOne(vehicleId);

      const unavailabilities = await this.vehicleUnavailabilityRepository.find({
        where: { vehicle_id: vehicleId },
        relations: ['vehicle'],
        order: { unavailable_from: 'ASC' },
      });

      return unavailabilities;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async update(
    id: string,
    ownerId: string,
    updateVehicleDto: UpdateVehicleDto,
    requester: User,
  ) {
    try {
      const vehicle = await this.findOne(id);
      console.log(requester.roles);

      const isAdmin = requester.roles.includes(ValidRoles.ADMIN);
      const isSelf = requester.id === vehicle!.ownerId;


      if (!isAdmin && !isSelf) {
        throw new ForbiddenException('You are not the owner of this vehicle');
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const updatedVehicle = await this.vehicleRepository.preload({
          id,
          ...updateVehicleDto,
        });

        if (!updatedVehicle) {
          throw new NotFoundException(`Vehicle with id "${id}" not found`);
        }

        await queryRunner.manager.save(updatedVehicle);
        await queryRunner.commitTransaction();
        await queryRunner.release();

        return await this.findOne(id);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw error;
      }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string, requester: User,
  ): Promise<void> {
    try {
      const vehicle = await this.findOne(id);

      const isAdmin = requester.roles.includes(ValidRoles.ADMIN);
      const isSelf = requester.id === vehicle!.ownerId;


      if (!isAdmin && !isSelf) {
        throw new ForbiddenException('You are not the owner of this vehicle');
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const rentals = await queryRunner.manager.query(
          `SELECT id FROM rental WHERE vehicle_id = $1`,
          [id],
        );
        const rentalIds = rentals.map((rental: any) => rental.id);

        if (rentalIds.length > 0) {
          await queryRunner.manager.delete('review', {
            rental_id: In(rentalIds),
          });
        }

        await queryRunner.manager.delete('vehicle_unavailability', {
          vehicle_id: id,
        });

        await queryRunner.manager.delete('rental', { vehicle_id: id });
        await queryRunner.manager.remove(vehicle);

        await queryRunner.commitTransaction();
        await queryRunner.release();
      } catch (error) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw error;
      }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private async fetchVehicleDataFromAPI(
    make: string,
    vehicleModel: string,
    year: number,
  ): Promise<Partial<Vehicle>> {
    try {
      const apiKey = this.configService.get<string>('API_KEY');
      const response = await firstValueFrom(
        this.httpService.get<
          {
            class: string;
            drive: string;
            fuel_type: string;
            transmission: string;
          }[]
        >(this.API_URL, {
          params: { make, model: vehicleModel, year },
          headers: { 'X-Api-Key': apiKey },
        }),
      );

      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        return {
          class: data.class,
          drive: data.drive,
          fuel_type: data.fuel_type,
          transmission: data.transmission,
        };
      }

      return {};
    } catch (error) {
      this.logger.error(
        `Error fetching vehicle data from API: ${error.message}`,
      );
      return {};
    }
  }

  private handleExceptions(error: any) {
    if (error instanceof BadRequestException) throw error;
    if (error instanceof NotFoundException) throw error;
    if (error instanceof ForbiddenException) throw error;

    if (error.code === '23505') throw new BadGatewayException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
