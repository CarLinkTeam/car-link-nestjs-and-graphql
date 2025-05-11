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

describe('RentalsModule get one (e2e)', () => {
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
  const testRental = {
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

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    userId = userResponse.body.user.id;
    authToken = userResponse.body.token;

    const promotionResponse = await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send();

    const vehicleResponse = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testVehicle);

    vehicleId = vehicleResponse.body.id;
    testRental.vehicle_id = vehicleId;

    // Create test rental
    const rentalResponse = await request(app.getHttpServer())
      .post('/rentals')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testRental);

    rentalId = rentalResponse.body.id;
  });

  afterAll(async () => {
    await rentalRepository.delete({ client_id: userId });
    await vehicleRepository.delete({ id: vehicleId });
    await userRepository.delete({ id: userId });
    await app.close();
  });

  it('/rentals/:term (GET) - unauthorized', async () => {
    const response = await request(app.getHttpServer()).get(
      `/rentals/${rentalId}`,
    );

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('/rentals/:term (GET) - not found', async () => {
    const response = await request(app.getHttpServer())
      .get('/rentals/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('not found');
  });

  it('/rentals/:term (GET) - find by ID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/rentals/${rentalId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.client).toBeDefined();
    expect(response.body.vehicle).toBeDefined();
    expect(response.body.status).toBe('pending');
  });

  it('/rentals/:term (GET) - find by date', async () => {
    const searchDate = testRental.initialDate.toString().split('T')[0];

    const response = await request(app.getHttpServer())
      .get(`/rentals/${searchDate}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(rentalId);
    expect(response.body.client).toBeDefined();
    expect(response.body.vehicle).toBeDefined();
  });

  it('/rentals/:term (GET) - invalid date format', async () => {
    const response = await request(app.getHttpServer())
      .get('/rentals/not-a-date')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('not found');
  });
});
