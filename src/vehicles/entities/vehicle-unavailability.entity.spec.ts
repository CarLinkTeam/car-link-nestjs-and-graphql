import { VehicleUnavailability } from './vehicle-unavailability.entity';
import { Vehicle } from './vehicle.entity';

describe('VehicleUnavailability Entity', () => {
  it('should be defined', () => {
    expect(new VehicleUnavailability()).toBeDefined();
  });

  it('should have correct properties', () => {
    const unavailability = new VehicleUnavailability();
    unavailability.id = '1';
    unavailability.unavailable_from = new Date('2023-01-01');
    unavailability.unavailable_to = new Date('2023-01-10');
    unavailability.vehicle = new Vehicle();
    unavailability.vehicle_id = 'vehicle-1';

    expect(unavailability.id).toBe('1');
    expect(unavailability.unavailable_from).toEqual(new Date('2023-01-01'));
    expect(unavailability.unavailable_to).toEqual(new Date('2023-01-10'));
    expect(unavailability.vehicle).toBeInstanceOf(Vehicle);
    expect(unavailability.vehicle_id).toBe('vehicle-1');
  });

  it('should have correct property types when assigned', () => {
    const unavailability = new VehicleUnavailability();
    unavailability.id = '1';
    unavailability.unavailable_from = new Date();
    unavailability.unavailable_to = new Date();
    unavailability.vehicle_id = 'vehicle-1';

    expect(typeof unavailability.id).toBe('string');
    expect(unavailability.unavailable_from).toBeInstanceOf(Date);
    expect(unavailability.unavailable_to).toBeInstanceOf(Date);
    expect(typeof unavailability.vehicle_id).toBe('string');
  });

  it('should initialize with undefined properties', () => {
    const unavailability = new VehicleUnavailability();

    expect(unavailability.id).toBeUndefined();
    expect(unavailability.unavailable_from).toBeUndefined();
    expect(unavailability.unavailable_to).toBeUndefined();
    expect(unavailability.vehicle).toBeUndefined();
    expect(unavailability.vehicle_id).toBeUndefined();
  });
});
