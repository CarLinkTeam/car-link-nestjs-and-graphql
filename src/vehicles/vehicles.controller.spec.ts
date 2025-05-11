import { Test, type TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import type { CreateVehicleDto } from './dto/create-vehicle.dto';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto';
import type { User } from '../users/entities/user.entity';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

jest.mock('../auth/decorators/auth.decorator', () => ({
  Auth: (...roles: string[]) => jest.fn(),
}));

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let service: VehiclesService;

  const mockVehicleResponseDto = {
    id: 'test-id',
    ownerId: 'owner-id',
    vehicleModel: 'Model 3',
    make: 'Tesla',
    color: 'Red',
    year: 2022,
    license_plate: 'ABC123',
    url_photos: ['photo1.jpg', 'photo2.jpg'],
    daily_price: 100,
    rental_conditions: 'No smoking',
    class: 'Electric',
    drive: 'AWD',
    fuel_type: 'Electric',
    transmission: 'Automatic',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVehiclesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByOwner: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: User = {
    id: 'owner-id',
    email: 'test@example.com',
    fullName: 'Test User',
    location: 'Test Location',
    phone: '+123456789',
    isActive: true,
    roles: ['OWNER'],
    checkFieldsBeforeInsert: jest.fn(),
    checkFieldsBeforeUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    service = module.get<VehiclesService>(VehiclesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a vehicle', async () => {
      const createVehicleDto: CreateVehicleDto = {
        vehicleModel: 'Model 3',
        make: 'Tesla',
        color: 'Red',
        year: 2022,
        license_plate: 'ABC123',
        url_photos: ['photo1.jpg', 'photo2.jpg'],
        daily_price: 100,
        rental_conditions: 'No smoking',
      };

      mockVehiclesService.create.mockResolvedValue(mockVehicleResponseDto);

      const result = await controller.create(mockUser, createVehicleDto);

      expect(service.create).toHaveBeenCalledWith(
        mockUser.id,
        createVehicleDto,
      );
      expect(result).toEqual(mockVehicleResponseDto);
    });

    it('should handle errors when creating a vehicle', async () => {
      const createVehicleDto: CreateVehicleDto = {
        vehicleModel: 'Model 3',
        make: 'Tesla',
        color: 'Red',
        year: 2022,
        license_plate: 'ABC123',
        url_photos: ['photo1.jpg', 'photo2.jpg'],
        daily_price: 100,
        rental_conditions: 'No smoking',
      };

      const error = new BadRequestException(
        'Vehicle with this license plate already exists',
      );
      mockVehiclesService.create.mockRejectedValue(error);

      await expect(
        controller.create(mockUser, createVehicleDto),
      ).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(
        mockUser.id,
        createVehicleDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of vehicles', async () => {
      const vehicles = [mockVehicleResponseDto, mockVehicleResponseDto];
      mockVehiclesService.findAll.mockResolvedValue(vehicles);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(vehicles);
    });

    it('should handle errors when finding all vehicles', async () => {
      const error = new NotFoundException('Vehicles not found');
      mockVehiclesService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(NotFoundException);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findMyVehicles', () => {
    it('should return vehicles owned by the user', async () => {
      const vehicles = [mockVehicleResponseDto, mockVehicleResponseDto];
      mockVehiclesService.findByOwner.mockResolvedValue(vehicles);

      const result = await controller.findMyVehicles(mockUser);

      expect(service.findByOwner).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(vehicles);
    });

    it('should handle errors when finding user vehicles', async () => {
      const error = new NotFoundException('Vehicles not found');
      mockVehiclesService.findByOwner.mockRejectedValue(error);

      await expect(controller.findMyVehicles(mockUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findByOwner).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id', async () => {
      mockVehiclesService.findOne.mockResolvedValue(mockVehicleResponseDto);
      const id = 'test-id';

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockVehicleResponseDto);
    });

    it('should handle errors when finding a vehicle by id', async () => {
      const id = 'non-existent-id';
      const error = new NotFoundException('Vehicle not found');
      mockVehiclesService.findOne.mockRejectedValue(error);

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a vehicle', async () => {
      const id = 'test-id';
      const updateVehicleDto: UpdateVehicleDto = {
        color: 'Blue',
        daily_price: 120,
      };

      mockVehiclesService.update.mockResolvedValue({
        ...mockVehicleResponseDto,
        color: 'Blue',
        daily_price: 120,
      });

      const result = await controller.update(id, mockUser, updateVehicleDto);

      expect(service.update).toHaveBeenCalledWith(
        id,
        mockUser.id,
        updateVehicleDto,
      );
      expect(result).toEqual({
        ...mockVehicleResponseDto,
        color: 'Blue',
        daily_price: 120,
      });
    });

    it('should handle not found error when updating a vehicle', async () => {
      const id = 'non-existent-id';
      const updateVehicleDto: UpdateVehicleDto = {
        color: 'Blue',
      };

      const error = new NotFoundException('Vehicle not found');
      mockVehiclesService.update.mockRejectedValue(error);

      await expect(
        controller.update(id, mockUser, updateVehicleDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(
        id,
        mockUser.id,
        updateVehicleDto,
      );
    });

    it('should handle forbidden error when updating a vehicle', async () => {
      const id = 'test-id';
      const updateVehicleDto: UpdateVehicleDto = {
        color: 'Blue',
      };

      const error = new ForbiddenException(
        'You are not the owner of this vehicle',
      );
      mockVehiclesService.update.mockRejectedValue(error);

      await expect(
        controller.update(id, mockUser, updateVehicleDto),
      ).rejects.toThrow(ForbiddenException);
      expect(service.update).toHaveBeenCalledWith(
        id,
        mockUser.id,
        updateVehicleDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a vehicle', async () => {
      const id = 'test-id';
      mockVehiclesService.remove.mockResolvedValue(undefined);

      await controller.remove(id, mockUser);

      expect(service.remove).toHaveBeenCalledWith(id, mockUser.id);
    });

    it('should handle not found error when removing a vehicle', async () => {
      const id = 'non-existent-id';
      const error = new NotFoundException('Vehicle not found');
      mockVehiclesService.remove.mockRejectedValue(error);

      await expect(controller.remove(id, mockUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.remove).toHaveBeenCalledWith(id, mockUser.id);
    });

    it('should handle forbidden error when removing a vehicle', async () => {
      const id = 'test-id';
      const error = new ForbiddenException(
        'You are not the owner of this vehicle',
      );
      mockVehiclesService.remove.mockRejectedValue(error);

      await expect(controller.remove(id, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.remove).toHaveBeenCalledWith(id, mockUser.id);
    });
  });
});
