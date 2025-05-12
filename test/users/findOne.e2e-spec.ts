import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/users/entities/user.entity';
import { Repository } from 'typeorm';

describe('Users - FindOne (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authToken: string;
  let userId: string;

  const testUser = {
    email: `find-one-test-user-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Test User',
    phone: '+573111234568',
    location: 'Test Location',
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

    userRepository = app.get<Repository<User>>(getRepositoryToken(User));

    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    userId = userResponse.body.user.id;
    authToken = userResponse.body.token;
  }, 10000);

  afterAll(async () => {
    await userRepository.delete({ id: userId });
    await app.close();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app.getHttpServer()).get(`/users/${userId}`);
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });

  it('should return 404 if user does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app.getHttpServer())
      .get(`/users/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe(`User with id ${fakeId} not found`);
  });

  it('should return user details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: userId,
      email: testUser.email,
      fullName: testUser.fullName,
      location: testUser.location,
      phone: testUser.phone,
      roles: expect.any(Array),
      isActive: true,
    });
  });

});
