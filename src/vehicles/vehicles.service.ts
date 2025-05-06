import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleResponseDto } from './dto/vehicle-response.dto';

@Injectable()
export class VehiclesService {
  private readonly API_URL = 'https://api.api-ninjas.com/v1/cars';

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    ownerId: string,
    createVehicleDto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    // Check if vehicle with license plate already exists
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { license_plate: createVehicleDto.license_plate },
    });

    if (existingVehicle) {
      throw new BadRequestException(
        'Vehicle with this license plate already exists',
      );
    }

    // Fetch additional data from external API
    const apiData = await this.fetchVehicleDataFromAPI(
      createVehicleDto.make,
      createVehicleDto.vehicleModel,
      createVehicleDto.year,
    );

    // Create new vehicle
    const newVehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      ownerId,
      ...apiData,
    });

    const savedVehicle = await this.vehicleRepository.save(newVehicle);
    return new VehicleResponseDto(savedVehicle);
  }

  async findAll(): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehicleRepository.find();

    if (!vehicles.length) {
      throw new NotFoundException('Vehicles not found');
    }

    return vehicles.map((vehicle) => new VehicleResponseDto(vehicle));
  }

  async findOne(id: string): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return new VehicleResponseDto(vehicle);
  }

  async findByLicensePlate(licensePlate: string): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { license_plate: licensePlate },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return new VehicleResponseDto(vehicle);
  }

  async findByOwner(ownerId: string): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehicleRepository.find({ where: { ownerId } });

    if (!vehicles.length) {
      throw new NotFoundException('Vehicles not found');
    }

    return vehicles.map((vehicle) => new VehicleResponseDto(vehicle));
  }

  async update(
    id: string,
    ownerId: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.ownerId !== ownerId) {
      throw new ForbiddenException('You are not the owner of this vehicle');
    }

    await this.vehicleRepository.update(id, updateVehicleDto);
    const updatedVehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    return new VehicleResponseDto(updatedVehicle!);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.ownerId !== ownerId) {
      throw new ForbiddenException('You are not the owner of this vehicle');
    }

    await this.vehicleRepository.delete(id);
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
      console.error('Error fetching vehicle data from API:', error);
      return {};
    }
  }
}
