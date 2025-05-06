import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { VehicleResponseDto } from './vehicle-response.dto';

describe('VehicleResponseDto', () => {
  it('should create an instance from Vehicle entity', () => {
    const mockUser = new User();
    mockUser.id = 'user-123';
    mockUser.email = 'test@example.com';
    mockUser.fullName = 'Test User';
    mockUser.location = 'Test Location';
    mockUser.phone = '123456789';

    const mockVehicle: Vehicle = {
      id: '123',
      ownerId: '456',
      owner: mockUser,
      vehicleModel: 'Model X',
      make: 'Tesla',
      color: 'Red',
      year: 2020,
      license_plate: 'ABC123',
      url_photos: ['photo1.jpg'],
      daily_price: 100,
      rental_conditions: 'Conditions',
      class: 'SUV',
      drive: 'AWD',
      fuel_type: 'Electric',
      transmission: 'Automatic',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dto = new VehicleResponseDto(mockVehicle);

    expect(dto).toBeDefined();
    expect(dto.id).toBe(mockVehicle.id);
    expect(dto.ownerId).toBe(mockVehicle.ownerId);
    expect(dto.vehicleModel).toBe(mockVehicle.vehicleModel);
    expect(dto.make).toBe(mockVehicle.make);
    expect(dto.color).toBe(mockVehicle.color);
    expect(dto.year).toBe(mockVehicle.year);
    expect(dto.license_plate).toBe(mockVehicle.license_plate);
    expect(dto.url_photos).toEqual(mockVehicle.url_photos);
    expect(dto.daily_price).toBe(mockVehicle.daily_price);
    expect(dto.rental_conditions).toBe(mockVehicle.rental_conditions);
    expect(dto.class).toBe(mockVehicle.class);
    expect(dto.drive).toBe(mockVehicle.drive);
    expect(dto.fuel_type).toBe(mockVehicle.fuel_type);
    expect(dto.transmission).toBe(mockVehicle.transmission);
    expect(dto.createdAt).toBe(mockVehicle.createdAt);
    expect(dto.updatedAt).toBe(mockVehicle.updatedAt);
  });

  it('should handle optional fields when not provided', () => {
    const mockVehicle: Vehicle = {
      id: '123',
      ownerId: '456',
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
      owner: null,
    } as any;

    const dto = new VehicleResponseDto(mockVehicle);

    expect(dto.class).toBeUndefined();
    expect(dto.drive).toBeUndefined();
    expect(dto.fuel_type).toBeUndefined();
    expect(dto.transmission).toBeUndefined();
  });
});
