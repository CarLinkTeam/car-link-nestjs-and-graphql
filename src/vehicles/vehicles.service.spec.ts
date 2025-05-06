import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { VehiclesService } from './vehicles.service';
import { Vehicle } from './entities/vehicle.entity';
import type { CreateVehicleDto } from './dto/create-vehicle.dto';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepository: Repository<Vehicle>;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockVehicle: Vehicle = {
    id: 'vehicle-123',
    ownerId: 'user-123',
    vehicleModel: 'Model X',
    make: 'Tesla',
    color: 'Red',
    year: 2020,
    license_plate: 'ABC123',
    url_photos: ['photo1.jpg'],
    daily_price: 100,
    rental_conditions: 'Conditions',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Vehicle;

  const mockCreateDto: CreateVehicleDto = {
    vehicleModel: 'Model X',
    make: 'Tesla',
    color: 'Red',
    year: 2020,
    license_plate: 'ABC123',
    url_photos: ['photo1.jpg'],
    daily_price: 100,
    rental_conditions: 'Conditions',
  };

  const mockUpdateDto: UpdateVehicleDto = {
    color: 'Blue',
  };

  const mockApiResponse = {
    data: [
      {
        class: 'SUV',
        drive: 'AWD',
        fuel_type: 'Electric',
        transmission: 'Automatic',
      },
    ],
  };

  beforeEach(async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockReturnValue(mockVehicle),
            save: jest.fn().mockResolvedValue(mockVehicle),
            find: jest.fn().mockResolvedValue([mockVehicle]),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn().mockReturnValue(of(mockApiResponse)),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    vehicleRepository = module.get<Repository<Vehicle>>(
      getRepositoryToken(Vehicle),
    );
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a vehicle successfully', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(null);

      const result = await service.create('user-123', mockCreateDto);

      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { license_plate: mockCreateDto.license_plate },
      });
      expect(vehicleRepository.create).toHaveBeenCalledWith({
        ...mockCreateDto,
        ownerId: 'user-123',
        ...mockApiResponse.data[0],
      });
      expect(result).toBeInstanceOf(VehicleResponseDto);
    });

    it('should throw BadRequestException if license plate exists', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);

      await expect(service.create('user-123', mockCreateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle API errors gracefully', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(httpService, 'get').mockImplementation(() => {
        throw new Error('API Error');
      });

      const result = await service.create('user-123', mockCreateDto);
      expect(result).toBeInstanceOf(VehicleResponseDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of vehicles', async () => {
      const result = await service.findAll();
      expect(vehicleRepository.find).toHaveBeenCalled();
      expect(result).toEqual([new VehicleResponseDto(mockVehicle)]);
    });

    it('should throw NotFoundException if no vehicles found', async () => {
      jest.spyOn(vehicleRepository, 'find').mockResolvedValue([]);
      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a single vehicle', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);

      const result = await service.findOne('vehicle-123');
      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'vehicle-123' },
      });
      expect(result).toEqual(new VehicleResponseDto(mockVehicle));
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne('vehicle-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByLicensePlate', () => {
    it('should return a vehicle by license plate', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);

      const result = await service.findByLicensePlate('ABC123');
      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { license_plate: 'ABC123' },
      });
      expect(result).toEqual(new VehicleResponseDto(mockVehicle));
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findByLicensePlate('ABC123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByOwner', () => {
    it('should return vehicles owned by a user', async () => {
      jest.spyOn(vehicleRepository, 'find').mockResolvedValue([mockVehicle]);

      const result = await service.findByOwner('user-123');
      expect(vehicleRepository.find).toHaveBeenCalledWith({
        where: { ownerId: 'user-123' },
      });
      expect(result).toEqual([new VehicleResponseDto(mockVehicle)]);
    });

    it('should throw NotFoundException if no vehicles found', async () => {
      jest.spyOn(vehicleRepository, 'find').mockResolvedValue([]);
      await expect(service.findByOwner('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a vehicle', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);

      const result = await service.update(
        'vehicle-123',
        'user-123',
        mockUpdateDto,
      );
      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'vehicle-123' },
      });
      expect(vehicleRepository.update).toHaveBeenCalledWith(
        'vehicle-123',
        mockUpdateDto,
      );
      expect(result).toBeInstanceOf(VehicleResponseDto);
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(null);
      await expect(
        service.update('vehicle-123', 'user-123', mockUpdateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);
      await expect(
        service.update('vehicle-123', 'other-user', mockUpdateDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a vehicle', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);

      await service.remove('vehicle-123', 'user-123');
      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'vehicle-123' },
      });
      expect(vehicleRepository.delete).toHaveBeenCalledWith('vehicle-123');
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(null);
      await expect(service.remove('vehicle-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);
      await expect(service.remove('vehicle-123', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('fetchVehicleDataFromAPI', () => {
    it('should fetch data from external API', async () => {
      const result = await service['fetchVehicleDataFromAPI'](
        'Tesla',
        'Model X',
        2020,
      );
      expect(httpService.get).toHaveBeenCalledWith(service['API_URL'], {
        params: { make: 'Tesla', model: 'Model X', year: 2020 },
        headers: { 'X-Api-Key': 'test-api-key' },
      });
      expect(result).toEqual(mockApiResponse.data[0]);
    });

    it('should return empty object on API error', async () => {
      jest.spyOn(httpService, 'get').mockImplementation(() => {
        throw new Error('API Error');
      });

      const result = await service['fetchVehicleDataFromAPI'](
        'Tesla',
        'Model X',
        2020,
      );
      expect(result).toEqual({});
    });
  });
});
