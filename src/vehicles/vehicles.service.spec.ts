import { Test, type TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { isUUID } from 'class-validator';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

jest.mock('class-validator', () => ({
  isUUID: jest.fn(),
}));

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepository: Repository<Vehicle>;
  let httpService: HttpService;
  let configService: ConfigService;
  let dataSource: DataSource;

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

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      remove: jest.fn(),
      query: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockReturnValue(mockVehicle),
            find: jest.fn(),
            preload: jest.fn().mockResolvedValue(mockVehicle),
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
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
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
    dataSource = module.get<DataSource>(DataSource);

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a vehicle successfully', async () => {
      // Mock para verificar si existe un vehículo con la misma placa
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(null);

      // Mock para guardar el vehículo
      mockQueryRunner.manager.save.mockResolvedValue(mockVehicle);

      const result = await service.create('user-123', mockCreateDto);

      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { license_plate: mockCreateDto.license_plate },
      });
      expect(vehicleRepository.create).toHaveBeenCalledWith({
        ...mockCreateDto,
        ownerId: 'user-123',
        ...mockApiResponse.data[0],
      });
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(mockVehicle);
    });

    it('should throw BadRequestException if license plate exists', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);

      await expect(service.create('user-123', mockCreateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { license_plate: mockCreateDto.license_plate },
      });
    });

    it('should handle transaction errors', async () => {
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(null);
      const originalLogger = service['logger'];
      Object.defineProperty(service, 'logger', { value: { error: jest.fn() } });
      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.create('user-123', mockCreateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      Object.defineProperty(service, 'logger', { value: originalLogger });
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of vehicles', async () => {
      jest.spyOn(vehicleRepository, 'find').mockResolvedValue([mockVehicle]);

      const result = await service.findAll();
      expect(vehicleRepository.find).toHaveBeenCalledWith({
        relations: ['owner'],
      });
      expect(result).toEqual([mockVehicle]);
    });

    it('should throw NotFoundException if no vehicles found', async () => {
      jest.spyOn(vehicleRepository, 'find').mockResolvedValue([]);
      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a single vehicle by id', async () => {
      (isUUID as jest.Mock).mockReturnValue(true);
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);

      const result = await service.findOne('vehicle-123');
      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'vehicle-123' },
        relations: ['owner'],
      });
      expect(result).toEqual(mockVehicle);
    });

    it('should return a single vehicle by license plate', async () => {
      (isUUID as jest.Mock).mockReturnValue(false);
      jest.spyOn(vehicleRepository, 'findOne').mockResolvedValue(mockVehicle);

      const result = await service.findOne('ABC123');
      expect(vehicleRepository.findOne).toHaveBeenCalledWith({
        where: { license_plate: 'ABC123' },
        relations: ['owner'],
      });
      expect(result).toEqual(mockVehicle);
    });
  });

  describe('findByOwner', () => {
    it('should return vehicles owned by a user', async () => {
      jest.spyOn(vehicleRepository, 'find').mockResolvedValue([mockVehicle]);

      const result = await service.findByOwner('user-123');
      expect(vehicleRepository.find).toHaveBeenCalledWith({
        where: { ownerId: 'user-123' },
        relations: ['owner'],
      });
      expect(result).toEqual([mockVehicle]);
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
      jest.spyOn(service, 'findOne').mockResolvedValue(mockVehicle);

      jest.spyOn(vehicleRepository, 'preload').mockResolvedValue({
        ...mockVehicle,
        ...mockUpdateDto,
      });

      mockQueryRunner.manager.save.mockResolvedValue({
        ...mockVehicle,
        ...mockUpdateDto,
      });

      const result = await service.update(
        'vehicle-123',
        'user-123',
        mockUpdateDto,
      );

      expect(service.findOne).toHaveBeenCalledWith('vehicle-123');
      expect(vehicleRepository.preload).toHaveBeenCalledWith({
        id: 'vehicle-123',
        ...mockUpdateDto,
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(result).toEqual(mockVehicle);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockVehicle);

      await expect(
        service.update('vehicle-123', 'other-user', mockUpdateDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if vehicle not found during preload', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockVehicle);
      jest.spyOn(vehicleRepository, 'preload').mockResolvedValue(undefined);

      await expect(
        service.update('vehicle-123', 'user-123', mockUpdateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a vehicle', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockVehicle);

      mockQueryRunner.manager.query = jest.fn().mockResolvedValue([]);
      mockQueryRunner.manager.delete = jest.fn().mockResolvedValue({});

      await service.remove('vehicle-123', 'user-123');

      expect(service.findOne).toHaveBeenCalledWith('vehicle-123');
      expect(mockQueryRunner.manager.query).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockVehicle);

      await expect(service.remove('vehicle-123', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
