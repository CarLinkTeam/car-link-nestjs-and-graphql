import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: User = {
    id: 'uuid-1234',
    email: 'jane@example.com',
    password: 'EncryptedPass',
    fullName: 'Jane Doe',
    phone: '+12345678901',
    location: 'Madrid',
    isActive: true,
    roles: ['TENANT'],
    checkFieldsBeforeInsert: () => {},
    checkFieldsBeforeUpdate: () => {},
  };

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([mockUser]),
    findById: jest.fn().mockImplementation((id: string) => Promise.resolve({ ...mockUser, id })),
    update: jest.fn().mockImplementation((id, dto, requester) => Promise.resolve({ ...mockUser, ...dto })),
    remove: jest.fn().mockImplementation((id, requester) => Promise.resolve({ message: `User ${id} removed` })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockUser]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const result = await controller.findOne('uuid-1234');
      expect(result).toEqual({ ...mockUser, id: 'uuid-1234' });
      expect(service.findById).toHaveBeenCalledWith('uuid-1234');
    });
  });

  describe('update', () => {
    it('should update and return the updated user', async () => {
      const dto: UpdateUserDto = { fullName: 'Updated Name' };
      const requester = { id: 'admin-id' } as User;

      const result = await controller.update('uuid-1234', dto, requester);
      expect(result).toEqual({ ...mockUser, fullName: 'Updated Name' });
      expect(service.update).toHaveBeenCalledWith('uuid-1234', dto, requester);
    });
  });

  describe('remove', () => {
    it('should remove a user and return a message', async () => {
      const requester = { id: 'admin-id' } as User;
      const result = await controller.remove('uuid-1234', requester);
      expect(result).toEqual({ message: 'User uuid-1234 removed' });
      expect(service.remove).toHaveBeenCalledWith('uuid-1234', requester);
    });
  });
});
