import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateRentalDto } from './create-rental.dto';

describe('CreateRentalDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateRentalDto, {
      initialDate: new Date('2023-01-01'),
      finalDate: new Date('2023-01-10'),
      totalCost: 500.5,
      status: 'confirmed',
      vehicle_id: '9876fedc-ba98-4321-abcd-ef0123456789',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid date', async () => {
    const dto = plainToInstance(CreateRentalDto, {
      initialDate: 'not-a-date',
      finalDate: new Date('2023-01-10'),
      totalCost: 500.5,
      status: 'active',
      vehicle_id: '9876fedc-ba98-4321-abcd-ef0123456789',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('initialDate');
  });

  it('should fail validation with negative totalCost', async () => {
    const dto = plainToInstance(CreateRentalDto, {
      initialDate: new Date('2023-01-01'),
      finalDate: new Date('2023-01-10'),
      totalCost: -500.5,
      status: 'active',
      vehicle_id: '9876fedc-ba98-4321-abcd-ef0123456789',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('totalCost');
  });

  it('should fail validation with invalid status', async () => {
    const dto = plainToInstance(CreateRentalDto, {
      initialDate: new Date('2023-01-01'),
      finalDate: new Date('2023-01-10'),
      totalCost: 500.5,
      status: 'invalid-status',
      vehicle_id: '9876fedc-ba98-4321-abcd-ef0123456789',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });
});
