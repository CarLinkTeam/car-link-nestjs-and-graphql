import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { Repository } from 'typeorm';
import { Vehicle } from '../../src/vehicles/entities/vehicle.entity';
import { User } from '../../src/users/entities/user.entity';

describe('VehiclesModule Create (e2e)', () => {
  let app: INestApplication;
  let vehicleRepository: Repository<Vehicle>;
  let userRepository: Repository<User>;
  let ownerToken: string;
  let ownerId: string;
  let tenantToken: string;
  let tenantId: string;
  let vehicleId: string;

  const testOwner = {
    email: `test-owner-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Test Owner',
    phone: '+573111234568',
    location: 'Test Location',
  };

  const testTenant = {
    email: `test-tenant-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Test Tenant',
    phone: '+573111234569',
    location: 'Test Location',
  };

  const validVehicleDto = {
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

    const tenantResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testTenant);

    tenantId = tenantResponse.body.user.id;
    tenantToken = tenantResponse.body.token;
  }, 10000);

  afterAll(async () => {
    await vehicleRepository.delete({ id: vehicleId });
    await userRepository.delete({ id: ownerId });
    await userRepository.delete({ id: tenantId });
    await app.close();
  });

  it('/vehicles (POST) - without authentication', async () => {
    const response = await request(app.getHttpServer())
      .post('/vehicles')
      .send(validVehicleDto);

    expect(response.status).toBe(401);
  });

  it('/vehicles (POST) - without body', async () => {
    const response = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(Array.isArray(response.body.message)).toBeTruthy();
    expect(response.body.message).toContain('make must be a string');
    expect(response.body.message).toContain('vehicleModel must be a string');
    expect(response.body.message).toContain(
      'year must be a number conforming to the specified constraints',
    );
    expect(response.body.message).toContain('license_plate must be a string');
    expect(response.body.message).toContain('color must be a string');
    expect(response.body.message).toContain(
      'daily_price must be a number conforming to the specified constraints',
    );
  });

  it('/vehicles (POST) - user without owner role', async () => {
    const response = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send(validVehicleDto);

    expect(response.status).toBe(403);
  });

  it('/vehicles (POST) - invalid data (negative price)', async () => {
    const invalidVehicleDto = {
      ...validVehicleDto,
      daily_price: -50,
    };

    const response = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(invalidVehicleDto);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      'daily_price must be a positive number',
    );
  });

  it('/vehicles (POST) - invalid data (future year)', async () => {
    const futureYear = new Date().getFullYear() + 2;
    const invalidVehicleDto = {
      ...validVehicleDto,
      year: futureYear,
    };

    const response = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(invalidVehicleDto);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('year must not be a future year');
  });

  it('/vehicles (POST) - valid vehicle creation', async () => {
    const response = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validVehicleDto);

    vehicleId = response.body.id;

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.make).toBe(validVehicleDto.make);
    expect(response.body.vehicleModel).toBe(validVehicleDto.vehicleModel);
    expect(response.body.year).toBe(validVehicleDto.year);
    expect(response.body.license_plate).toBe(validVehicleDto.license_plate);
    expect(response.body.ownerId).toBe(ownerId);
  });

  it('/vehicles (POST) - duplicate vehicle license plate', async () => {
    const response = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send(validVehicleDto);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already exists');
  });
});
