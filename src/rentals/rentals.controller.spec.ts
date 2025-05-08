import { Test, TestingModule } from '@nestjs/testing';
import { RentalsController } from './rentals.controller';
import { RentalsService } from './rentals.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';
import { User } from '../users/entities/user.entity';

jest.mock('../auth/decorators/auth.decorator', () => ({
  Auth: (...roles: string[]) => jest.fn(),
}));

// Mockear el decorador GetUser
jest.mock('../auth/decorators/get-user.decorator', () => ({
  GetUser: () => jest.fn((target: any, key: string, index: number) => {}),
}));

describe('RentalsController', () => {
  let controller: RentalsController;
  let service: RentalsService;

  const mockUser: User = {
    id: 'client-id',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Test User',
    location: 'Test Location',
    phone: '+12345678901',
    isActive: true,
    roles: ['TENANT'],
  } as User;

  const mockRentalsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    confirmRental: jest.fn(),
    rejectRental: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RentalsController],
      providers: [
        {
          provide: RentalsService,
          useValue: mockRentalsService,
        },
      ],
    }).compile();

    controller = module.get<RentalsController>(RentalsController);
    service = module.get<RentalsService>(RentalsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call rentalsService.create with the provided dto and user id', async () => {
      const createRentalDto: CreateRentalDto = {
        initialDate: new Date('2023-01-01'),
        finalDate: new Date('2023-01-10'),
        totalCost: 500,
        status: 'pending',
        vehicle_id: 'vehicle-id',
      };

      const expectedResult = {
        id: 'rental-id',
        ...createRentalDto,
        client_id: mockUser.id,
      };
      mockRentalsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockUser, createRentalDto);

      expect(service.create).toHaveBeenCalledWith(mockUser.id, createRentalDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call rentalsService.findAll', async () => {
      const expectedResult = [{ id: 'rental-id-1' }, { id: 'rental-id-2' }];
      mockRentalsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should call rentalsService.findOne with the provided term', async () => {
      const term = 'rental-id';
      const expectedResult = { id: term };
      mockRentalsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(term);

      expect(service.findOne).toHaveBeenCalledWith(term);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call rentalsService.update with the provided id, dto and user id', async () => {
      const id = 'rental-id';
      const updateRentalDto: UpdateRentalDto = {
        totalCost: 600,
        status: 'confirmed',
      };
      const expectedResult = { id, ...updateRentalDto, client_id: mockUser.id };
      mockRentalsService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(id, updateRentalDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(
        id,
        updateRentalDto,
        mockUser.id,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call rentalsService.remove with the provided id', async () => {
      const id = 'rental-id';
      const expectedResult = { id };
      mockRentalsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('confirmRental', () => {
    it('should call rentalsService.confirmRental with the provided id', async () => {
      const id = 'rental-id';
      const expectedResult = { id, status: 'confirmed' };
      mockRentalsService.confirmRental.mockResolvedValue(expectedResult);

      const result = await controller.confirmRental(id);

      expect(service.confirmRental).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('rejectRental', () => {
    it('should call rentalsService.rejectRental with the provided id', async () => {
      const id = 'rental-id';
      const expectedResult = { id, status: 'canceled' };
      mockRentalsService.rejectRental.mockResolvedValue(expectedResult);

      const result = await controller.rejectRental(id);

      expect(service.rejectRental).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });
  });
});
