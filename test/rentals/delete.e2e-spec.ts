import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { Rental } from '../../src/rentals/entities/rental.entity';
import { User } from '../../src/users/entities/user.entity';
import { Vehicle } from '../../src/vehicles/entities/vehicle.entity';
import { VehicleUnavailability } from '../../src/vehicles/entities/vehicle-unavailability.entity';

describe('RentalsModule Delete (e2e)', () => {
  let app: INestApplication;
  let rentalRepository: Repository<Rental>;
  let userRepository: Repository<User>;
  let vehicleRepository: Repository<Vehicle>;
  let unavailabilityRepository: Repository<VehicleUnavailability>;
  let authToken: string;
  let userId: string;
  let vehicleId: string;
  let rentalId: string;

  const testUser = {
    email: `test-user-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Test User',
    phone: '+573111234568',
    location: 'Test Location',
  };

  const testVehicle = {
    make: 'Toyota',
    vehicleModel: 'Corolla',
    year: 2022,
    license_plate: `TEST-${Date.now()}`,
    color: 'Red',
    transmission: 'automatic',
    url_photos: ['http://example.com/photo1.jpg'],
    daily_price: 50,
    rental_conditions: '',
  };

  const validRentalDto = {
    initialDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    finalDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    vehicle_id: '',
    status: 'pending',
    totalCost: 100,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    rentalRepository = app.get<Repository<Rental>>(getRepositoryToken(Rental));
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    vehicleRepository = app.get<Repository<Vehicle>>(
      getRepositoryToken(Vehicle),
    );
    unavailabilityRepository = app.get<Repository<VehicleUnavailability>>(
      getRepositoryToken(VehicleUnavailability),
    );

    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    userId = userResponse.body.user.id;
    authToken = userResponse.body.token;

    // Promote user to owner
    await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    // Create test vehicle
    const vehicleResponse = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testVehicle);

    vehicleId = vehicleResponse.body.id;
    validRentalDto.vehicle_id = vehicleId;

    // Create test rental
    const rentalResponse = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validRentalDto);

    rentalId = rentalResponse.body.id;
  });

  afterAll(async () => {
    await vehicleRepository.delete({ id: vehicleId });
    await userRepository.delete({ id: userId });
    await app.close();
  });

  it('/rentals/:id (DELETE) - no authentication', async () => {
    const response = await request(app.getHttpServer()).delete(
      `/rentals/${rentalId}`,
    );

    expect(response.status).toBe(401);
  });

  it('/rentals/:id (DELETE) - invalid rental id', async () => {
    const response = await request(app.getHttpServer())
      .delete('/rentals/invalid-id')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  it('/rentals/:id (DELETE) - non-existent rental id', async () => {
    const response = await request(app.getHttpServer())
      .delete('/rentals/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
  });

  it('/rentals/:id (DELETE) - valid rental deletion', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/rentals/${rentalId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(204);

    // Verify rental was deleted
    const checkResponse = await request(app.getHttpServer())
      .get(`/rentals/${rentalId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(checkResponse.status).toBe(404);
  });
});
