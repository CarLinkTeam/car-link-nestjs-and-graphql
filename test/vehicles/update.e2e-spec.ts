import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { Vehicle } from '../../src/vehicles/entities/vehicle.entity';
import { User } from '../../src/users/entities/user.entity';

describe('VehiclesModule Update (e2e)', () => {
  let app: INestApplication;
  let vehicleRepository: Repository<Vehicle>;
  let userRepository: Repository<User>;
  let ownerToken: string;
  let ownerId: string;
  let vehicleId: string;
  let otherOwnerToken: string;
  let otherOwnerId: string;
  let tenantToken: string;
  let tenantId: string;

  const testOwner = {
    email: `test-owner-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Test Owner',
    phone: '+573111234568',
    location: 'Test Location',
  };

  const testOtherOwner = {
    email: `test-other-owner-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Test Other Owner',
    phone: '+573111234570',
    location: 'Test Location',
  };

  const testTenant = {
    email: `test-tenant-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Test Tenant',
    phone: '+573111234569',
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
    rental_conditions: 'No smoking',
  };

  const updateVehicleDto = {
    color: 'Blue',
    daily_price: 60.00,
    rental_conditions: 'No pets',
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

    vehicleRepository = app.get<Repository<Vehicle>>(
      getRepositoryToken(Vehicle),
    );
    userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    const ownerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testOwner);

    ownerId = ownerResponse.body.user.id;
    ownerToken = ownerResponse.body.token;

    await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${ownerId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send();

    const otherOwnerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testOtherOwner);

    otherOwnerId = otherOwnerResponse.body.user.id;
    otherOwnerToken = otherOwnerResponse.body.token;

    await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${otherOwnerId}`)
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .send();

    const tenantResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testTenant);

    tenantId = tenantResponse.body.user.id;
    tenantToken = tenantResponse.body.token;

    const vehicleResponse = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(testVehicle);

    vehicleId = vehicleResponse.body.id;
  }, 10000);

  afterAll(async () => {
    await vehicleRepository.delete({ id: vehicleId });
    await userRepository.delete({ id: ownerId });
    await userRepository.delete({ id: otherOwnerId });
    await userRepository.delete({ id: tenantId });
    await app.close();
  });

  it('/vehicles/:id (PATCH) - no authentication', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/vehicles/${vehicleId}`)
      .send(updateVehicleDto);

    expect(response.status).toBe(401);
  });

  it('/vehicles/:id (PATCH) - user without owner role', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .send(updateVehicleDto);

    expect(response.status).toBe(403);
  });

  it('/vehicles/:id (PATCH) - different owner', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .send(updateVehicleDto);

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('not the owner');
  });

  it('/vehicles/:id (PATCH) - non-existent ID', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.getHttpServer())
      .patch(`/vehicles/${nonExistentId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(updateVehicleDto);

    expect(response.status).toBe(404);
  });

  it('/vehicles/:id (PATCH) - invalid data (negative price)', async () => {
    const invalidUpdateDto = {
      daily_price: -10,
    };

    const response = await request(app.getHttpServer())
      .patch(`/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(invalidUpdateDto);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'daily_price must be a positive number',
    );
  });

  it('/vehicles/:id (PATCH) - valid update', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(updateVehicleDto);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(vehicleId);
    expect(response.body.color).toBe(updateVehicleDto.color);
    expect(response.body.rental_conditions).toBe(
      updateVehicleDto.rental_conditions,
    );

    expect(response.body.make).toBe(testVehicle.make);
    expect(response.body.vehicleModel).toBe(testVehicle.vehicleModel);
    expect(response.body.year).toBe(testVehicle.year);
    expect(response.body.license_plate).toBe(testVehicle.license_plate);
  });
});
