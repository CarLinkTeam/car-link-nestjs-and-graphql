import { Test, TestingModule } from '@nestjs/testing';
import { RentalsService } from './rentals.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { VehicleUnavailability } from '../vehicles/entities/vehicle-unavailability.entity';
import { UsersService } from '../users/users.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';

// Creamos un mock más detallado para el queryBuilder
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getCount: jest.fn(),
  orWhere: jest.fn().mockReturnThis(),
};

const mockRentalRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  preload: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
});

const mockUnavailabilityRepository = () => ({
  find: jest.fn(),
});

const mockUsersService = () => ({
  findById: jest.fn(),
});

const mockVehiclesService = () => ({
  findOne: jest.fn(),
});

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
    remove: jest.fn(),
  },
};

const mockDataSource = () => ({
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
});

describe('RentalsService', () => {
  let service: RentalsService;
  let rentalRepository: Repository<Rental>;
  let unavailabilityRepository: Repository<VehicleUnavailability>;
  let usersService: UsersService;
  let vehiclesService: VehiclesService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalsService,
        {
          provide: getRepositoryToken(Rental),
          useFactory: mockRentalRepository,
        },
        {
          provide: getRepositoryToken(VehicleUnavailability),
          useFactory: mockUnavailabilityRepository,
        },
        { provide: UsersService, useFactory: mockUsersService },
        { provide: VehiclesService, useFactory: mockVehiclesService },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    service = module.get<RentalsService>(RentalsService);
    rentalRepository = module.get<Repository<Rental>>(
      getRepositoryToken(Rental),
    );
    unavailabilityRepository = module.get<Repository<VehicleUnavailability>>(
      getRepositoryToken(VehicleUnavailability),
    );
    usersService = module.get<UsersService>(UsersService);
    vehiclesService = module.get<VehiclesService>(VehiclesService);
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a rental successfully', async () => {
      const createRentalDto: CreateRentalDto = {
        initialDate: new Date('2023-01-01'),
        finalDate: new Date('2023-01-10'),
        totalCost: 500,
        status: 'pending',
        client_id: 'client-id',
        vehicle_id: 'vehicle-id',
      };

      const expectedRental = {
        id: 'rental-id',
        ...createRentalDto,
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue({ id: 'client-id' } as any);
      jest
        .spyOn(vehiclesService, 'findOne')
        .mockResolvedValue({ id: 'vehicle-id' } as any);
      jest.spyOn(unavailabilityRepository, 'find').mockResolvedValue([]);
      mockQueryBuilder.getCount.mockResolvedValue(0);
      jest
        .spyOn(rentalRepository, 'create')
        .mockReturnValue(expectedRental as any);
      jest
        .spyOn(rentalRepository, 'save')
        .mockResolvedValue(expectedRental as any);

      const result = await service.create(createRentalDto);
      expect(result).toEqual(expectedRental);
      expect(usersService.findById).toHaveBeenCalledWith('client-id');
      expect(vehiclesService.findOne).toHaveBeenCalledWith('vehicle-id');
      expect(rentalRepository.create).toHaveBeenCalled();
      expect(rentalRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if start date is after end date', async () => {
      const createRentalDto: CreateRentalDto = {
        initialDate: new Date('2023-01-10'),
        finalDate: new Date('2023-01-01'),
        totalCost: 500,
        status: 'pending',
        client_id: 'client-id',
        vehicle_id: 'vehicle-id',
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue({ id: 'client-id' } as any);
      jest
        .spyOn(vehiclesService, 'findOne')
        .mockResolvedValue({ id: 'vehicle-id' } as any);

      await expect(service.create(createRentalDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if vehicle is unavailable', async () => {
      const createRentalDto: CreateRentalDto = {
        initialDate: new Date('2023-01-01'),
        finalDate: new Date('2023-01-10'),
        totalCost: 500,
        status: 'pending',
        client_id: 'client-id',
        vehicle_id: 'vehicle-id',
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue({ id: 'client-id' } as any);
      jest
        .spyOn(vehiclesService, 'findOne')
        .mockResolvedValue({ id: 'vehicle-id' } as any);
      jest
        .spyOn(unavailabilityRepository, 'find')
        .mockResolvedValue([{ id: 'unavailability-id' }] as any);

      await expect(service.create(createRentalDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if vehicle is already rented', async () => {
      const createRentalDto: CreateRentalDto = {
        initialDate: new Date('2023-01-01'),
        finalDate: new Date('2023-01-10'),
        totalCost: 500,
        status: 'pending',
        client_id: 'client-id',
        vehicle_id: 'vehicle-id',
      };

      jest
        .spyOn(usersService, 'findById')
        .mockResolvedValue({ id: 'client-id' } as any);
      jest
        .spyOn(vehiclesService, 'findOne')
        .mockResolvedValue({ id: 'vehicle-id' } as any);
      jest.spyOn(unavailabilityRepository, 'find').mockResolvedValue([]);

      mockQueryBuilder.getCount.mockResolvedValue(1);

      jest
        .spyOn(service as any, 'handleExeptions')
        .mockImplementation((error) => {
          throw error;
        });

      await expect(service.create(createRentalDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of rentals', async () => {
      const expectedRentals = [
        { id: 'rental-id-1', client: {}, vehicle: {} },
        { id: 'rental-id-2', client: {}, vehicle: {} },
      ];

      jest
        .spyOn(rentalRepository, 'find')
        .mockResolvedValue(expectedRentals as any);

      const result = await service.findAll();
      expect(result).toEqual(expectedRentals);
      expect(rentalRepository.find).toHaveBeenCalledWith({
        relations: ['client', 'vehicle'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a rental by id', async () => {
      const rentalId = '123e4567-e89b-12d3-a456-426614174001';
      const expectedRental = {
        id: rentalId,
        client: {},
        vehicle: {},
      };

      jest
        .spyOn(rentalRepository, 'findOne')
        .mockResolvedValue(expectedRental as any);

      const result = await service.findOne(rentalId);
      expect(result).toEqual(expectedRental);
      expect(rentalRepository.findOne).toHaveBeenCalledWith({
        where: { id: rentalId },
        relations: ['client', 'vehicle'],
      });
    });

    it('should return a rental by date', async () => {
      const searchDate = '2023-01-05';
      const expectedRental = {
        id: 'rental-id',
        initialDate: new Date('2023-01-01'),
        finalDate: new Date('2023-01-10'),
        client: {},
        vehicle: {},
      };

      jest.spyOn(rentalRepository, 'findOne').mockResolvedValue(null);

      mockQueryBuilder.getOne.mockResolvedValue(expectedRental as any);

      const result = await service.findOne(searchDate);
      expect(result).toEqual(expectedRental);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'DATE(rental.initialDate) = DATE(:searchDate)',
        { searchDate: new Date(searchDate) },
      );
      expect(mockQueryBuilder.orWhere).toHaveBeenCalledWith(
        'DATE(rental.finalDate) = DATE(:searchDate)',
        { searchDate: new Date(searchDate) },
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.getOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException if rental not found', async () => {
      const rentalId = 'non-existent-id';

      jest.spyOn(rentalRepository, 'findOne').mockResolvedValue(null);
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne(rentalId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a rental successfully', async () => {
      const rentalId = 'rental-id';
      const updateRentalDto: UpdateRentalDto = {
        totalCost: 600,
        status: 'confirmed',
      };

      const existingRental = {
        id: rentalId,
        initialDate: new Date('2023-01-01'),
        finalDate: new Date('2023-01-10'),
        vehicle_id: 'vehicle-id',
        client: {},
        vehicle: {},
      };

      const updatedRental = {
        ...existingRental,
        ...updateRentalDto,
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(existingRental as any);
      jest
        .spyOn(rentalRepository, 'preload')
        .mockResolvedValue(updatedRental as any);
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(updatedRental as any);

      const result = await service.update(rentalId, updateRentalDto);
      expect(result).toEqual(updatedRental);
      expect(rentalRepository.preload).toHaveBeenCalledWith({
        id: rentalId,
        ...updateRentalDto,
      });
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(updatedRental);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if start date is after end date', async () => {
      const rentalId = 'rental-id';
      const updateRentalDto: UpdateRentalDto = {
        initialDate: new Date('2023-01-10'),
        finalDate: new Date('2023-01-01'),
      };

      const existingRental = {
        id: rentalId,
        initialDate: new Date('2023-01-01'),
        finalDate: new Date('2023-01-10'),
        vehicle_id: 'vehicle-id',
        client: {},
        vehicle: {},
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingRental as any);

      await expect(service.update(rentalId, updateRentalDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if rental not found', async () => {
      const rentalId = 'non-existent-id';
      const updateRentalDto: UpdateRentalDto = {
        totalCost: 600,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: rentalId,
        initialDate: new Date('2023-01-01'),
        finalDate: new Date('2023-01-10'),
        vehicle_id: 'vehicle-id',
      } as any);
      jest.spyOn(rentalRepository, 'preload').mockResolvedValue(undefined);

      await expect(service.update(rentalId, updateRentalDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a rental successfully', async () => {
      const rentalId = 'rental-id';
      const existingRental = {
        id: rentalId,
        client: {},
        vehicle: {},
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingRental as any);

      const result = await service.remove(rentalId);
      expect(result).toEqual(existingRental);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.remove).toHaveBeenCalledWith(
        existingRental,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if rental not found', async () => {
      const rentalId = 'non-existent-id';

      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove(rentalId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmRental', () => {
    it('should confirm a rental successfully', async () => {
      const rentalId = 'rental-id';
      const pendingRental = {
        id: rentalId,
        status: 'pending',
        client: {},
        vehicle: {},
      };

      const confirmedRental = {
        ...pendingRental,
        status: 'confirmed',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(pendingRental as any);
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(confirmedRental as any);

      const result = await service.confirmRental(rentalId);
      expect(result).toEqual(confirmedRental);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if rental is not in pending status', async () => {
      const rentalId = 'rental-id';
      const confirmedRental = {
        id: rentalId,
        status: 'confirmed',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(confirmedRental as any);

      await expect(service.confirmRental(rentalId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectRental', () => {
    it('should reject a rental successfully', async () => {
      const rentalId = 'rental-id';
      const pendingRental = {
        id: rentalId,
        status: 'pending',
        client: {},
        vehicle: {},
      };

      const canceledRental = {
        ...pendingRental,
        status: 'canceled',
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(pendingRental as any);
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValueOnce(canceledRental as any);

      const result = await service.rejectRental(rentalId);
      expect(result).toEqual(canceledRental);
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if rental is not in pending status', async () => {
      const rentalId = 'rental-id';
      const confirmedRental = {
        id: rentalId,
        status: 'confirmed',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(confirmedRental as any);

      await expect(service.rejectRental(rentalId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
