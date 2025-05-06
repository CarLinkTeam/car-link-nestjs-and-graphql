import { Vehicle } from './vehicle.entity';
import { User } from '../../users/entities/user.entity';

describe('Vehicle Entity', () => {
  it('should be defined', () => {
    expect(new Vehicle()).toBeDefined();
  });

  it('should have correct properties', () => {
    const vehicle = new Vehicle();
    vehicle.id = '1';
    vehicle.vehicleModel = 'Model S';
    vehicle.make = 'Tesla';
    vehicle.color = 'Red';
    vehicle.year = 2020;
    vehicle.license_plate = 'TESLA123';
    vehicle.url_photos = ['photo1.jpg', 'photo2.jpg'];
    vehicle.daily_price = 150.5;
    vehicle.rental_conditions = 'Standard conditions';
    vehicle.class = 'Luxury';
    vehicle.drive = 'AWD';
    vehicle.fuel_type = 'Electric';
    vehicle.transmission = 'Automatic';
    vehicle.combination_mpg = 120;
    vehicle.displacement = 0;
    vehicle.createdAt = new Date();
    vehicle.updatedAt = new Date();
    vehicle.owner = new User();
    vehicle.ownerId = 'user-1';

    expect(vehicle.id).toBe('1');
    expect(vehicle.vehicleModel).toBe('Model S');
    expect(vehicle.make).toBe('Tesla');
    expect(vehicle.color).toBe('Red');
    expect(vehicle.year).toBe(2020);
    expect(vehicle.license_plate).toBe('TESLA123');
    expect(vehicle.url_photos).toEqual(['photo1.jpg', 'photo2.jpg']);
    expect(vehicle.daily_price).toBe(150.5);
    expect(vehicle.rental_conditions).toBe('Standard conditions');
    expect(vehicle.class).toBe('Luxury');
    expect(vehicle.drive).toBe('AWD');
    expect(vehicle.fuel_type).toBe('Electric');
    expect(vehicle.transmission).toBe('Automatic');
    expect(vehicle.combination_mpg).toBe(120);
    expect(vehicle.displacement).toBe(0);
    expect(vehicle.createdAt).toBeInstanceOf(Date);
    expect(vehicle.updatedAt).toBeInstanceOf(Date);
    expect(vehicle.owner).toBeInstanceOf(User);
    expect(vehicle.ownerId).toBe('user-1');
  });

  it('should handle optional fields when not provided', () => {
    const vehicle = new Vehicle();
    vehicle.id = '1';
    vehicle.vehicleModel = 'Model S';
    vehicle.make = 'Tesla';
    vehicle.color = 'Red';
    vehicle.year = 2020;
    vehicle.license_plate = 'TESLA123';
    vehicle.url_photos = ['photo1.jpg'];
    vehicle.daily_price = 150.5;
    vehicle.rental_conditions = 'Standard conditions';
    vehicle.ownerId = 'user-1';

    expect(vehicle.class).toBeUndefined();
    expect(vehicle.drive).toBeUndefined();
    expect(vehicle.fuel_type).toBeUndefined();
    expect(vehicle.transmission).toBeUndefined();
    expect(vehicle.combination_mpg).toBeUndefined();
    expect(vehicle.displacement).toBeUndefined();
    expect(vehicle.createdAt).toBeUndefined();
    expect(vehicle.updatedAt).toBeUndefined();
    expect(vehicle.owner).toBeUndefined();
  });

  it('should have correct property types when assigned', () => {
    const vehicle = new Vehicle();
    vehicle.id = '1';
    vehicle.vehicleModel = 'Model S';
    vehicle.make = 'Tesla';
    vehicle.color = 'Red';
    vehicle.year = 2020;
    vehicle.license_plate = 'TESLA123';
    vehicle.url_photos = ['photo1.jpg'];
    vehicle.daily_price = 150.5;
    vehicle.rental_conditions = 'Standard conditions';
    vehicle.ownerId = 'user-1';

    expect(typeof vehicle.id).toBe('string');
    expect(typeof vehicle.vehicleModel).toBe('string');
    expect(typeof vehicle.make).toBe('string');
    expect(typeof vehicle.color).toBe('string');
    expect(typeof vehicle.year).toBe('number');
    expect(typeof vehicle.license_plate).toBe('string');
    expect(Array.isArray(vehicle.url_photos)).toBe(true);
    expect(typeof vehicle.daily_price).toBe('number');
    expect(typeof vehicle.rental_conditions).toBe('string');
    expect(typeof vehicle.ownerId).toBe('string');
  });

  it('should initialize with undefined properties', () => {
    const vehicle = new Vehicle();

    expect(vehicle.id).toBeUndefined();
    expect(vehicle.vehicleModel).toBeUndefined();
    expect(vehicle.make).toBeUndefined();
    expect(vehicle.color).toBeUndefined();
    expect(vehicle.year).toBeUndefined();
    expect(vehicle.license_plate).toBeUndefined();
    expect(vehicle.url_photos).toBeUndefined();
    expect(vehicle.daily_price).toBeUndefined();
    expect(vehicle.rental_conditions).toBeUndefined();
    expect(vehicle.ownerId).toBeUndefined();
  });
});
