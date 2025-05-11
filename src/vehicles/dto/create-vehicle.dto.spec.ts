import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVehicleDto } from './create-vehicle.dto';

describe('CreateVehicleDto', () => {
  const validDto = {
    vehicleModel: 'Model X',
    make: 'Tesla',
    color: 'Red',
    year: 2020,
    license_plate: 'ABC123',
    url_photos: ['photo1.jpg'],
    daily_price: 100,
    rental_conditions: 'Standard rental conditions',
  };

  it('should be defined', () => {
    expect(new CreateVehicleDto()).toBeDefined();
  });

  it('should validate all required fields', async () => {
    const dto = new CreateVehicleDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(8);
  });

  it('should validate vehicleModel is string', async () => {
    const dto = plainToInstance(CreateVehicleDto, {
      ...validDto,
      vehicleModel: 123,
    });
    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should validate make is string', async () => {
    const dto = plainToInstance(CreateVehicleDto, { ...validDto, make: 123 });
    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should validate color is string', async () => {
    const dto = plainToInstance(CreateVehicleDto, { ...validDto, color: 123 });
    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should validate year is number and min 1900', async () => {
    const dto = plainToInstance(CreateVehicleDto, { ...validDto, year: 1899 });
    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should validate license_plate is string', async () => {
    const dto = plainToInstance(CreateVehicleDto, {
      ...validDto,
      license_plate: 123,
    });
    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should validate url_photos is array of strings', async () => {
    const dto = plainToInstance(CreateVehicleDto, {
      ...validDto,
      url_photos: [123, 'valid'],
    });
    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should validate daily_price is number and min 0', async () => {
    const dto = plainToInstance(CreateVehicleDto, {
      ...validDto,
      daily_price: -1,
    });
    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('isPositive');
  });

  it('should validate rental_conditions is string', async () => {
    const dto = plainToInstance(CreateVehicleDto, {
      ...validDto,
      rental_conditions: 123,
    });
    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should accept optional fields', async () => {
    const dto = plainToInstance(CreateVehicleDto, {
      ...validDto,
      class: 'SUV',
      drive: 'AWD',
      fuel_type: 'Electric',
      transmission: 'Automatic',
      displacement: 0,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
