import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateVehicleDto } from './update-vehicle.dto';
import { CreateVehicleDto } from './create-vehicle.dto';

describe('UpdateVehicleDto', () => {
  it('should allow partial updates', async () => {
    const dto = plainToInstance(UpdateVehicleDto, { color: 'Red' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate fields when provided', async () => {
    const dto = plainToInstance(UpdateVehicleDto, { year: 1899 });
    const errors = await validate(dto);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should not require any fields', async () => {
    const dto = plainToInstance(UpdateVehicleDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
