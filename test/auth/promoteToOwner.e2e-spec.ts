import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ValidRoles } from '../../src/auth/enums/valid-roles.enum';

describe('Auth - Promote To Owner (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const adminUser = {
    email: `Oadmin-to-owner-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Admin',
    phone: '+573111111111',
    location: 'Admin Location',
  };

  const tenantUser = {
    email: `Otenant-to-owner-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Tenant',
    phone: '+573122222222',
    location: 'Tenant Location',
  };

  const otherUser = {
    email: `Oother-to-owner-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Other',
    phone: '+573133333333',
    location: 'Other Location',
  };

  let adminToken: string;
  let tenantToken: string;
  let otherToken: string;

  let adminUserId: string;
  let tenantUserId: string;
  let otherUserId: string;

  beforeEach(async () => {
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

    const httpServer = app.getHttpServer();

    // Register users
    const admin = await request(httpServer).post('/auth/register').send(adminUser);
    const tenant = await request(httpServer).post('/auth/register').send(tenantUser);
    const other = await request(httpServer).post('/auth/register').send(otherUser);

    adminUserId = admin.body.user.id;
    tenantUserId = tenant.body.user.id;
    otherUserId = other.body.user.id;

    await userRepository.update(adminUserId, { roles: [ValidRoles.ADMIN] });
    await userRepository.update(tenantUserId, { roles: [ValidRoles.TENANT] });
    await userRepository.update(otherUserId, { roles: [ValidRoles.OWNER] });

    // Login users
    const adminLogin = await request(httpServer).post('/auth/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });

    const tenantLogin = await request(httpServer).post('/auth/login').send({
      email: tenantUser.email,
      password: tenantUser.password,
    });

    const otherLogin = await request(httpServer).post('/auth/login').send({
      email: otherUser.email,
      password: otherUser.password,
    });

    adminToken = adminLogin.body.token;
    tenantToken = tenantLogin.body.token;
    otherToken = otherLogin.body.token;
  });

  afterEach(async () => {
    await userRepository.delete({ id: adminUserId });
    await userRepository.delete({ id: tenantUserId });
    await userRepository.delete({ id: otherUserId });
    await app.close();
  });

  it('should allow an admin to promote another user to OWNER', async () => {
    const response = await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${tenantUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(response.body.message).toBe(`User promoted to ${ValidRoles.OWNER}`);
    expect(response.body.user.roles).toContain(ValidRoles.OWNER);
  });

  it('should allow a TENANT to promote themselves to OWNER', async () => {
    const response = await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${tenantUserId}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(201);

    expect(response.body.message).toBe(`User promoted to ${ValidRoles.OWNER}`);
    expect(response.body.user.roles).toContain(ValidRoles.OWNER);
  });

  it('should NOT allow a TENANT to promote another user to OWNER', async () => {
    const response = await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${otherUserId}`)
      .set('Authorization', `Bearer ${tenantToken}`)
      .expect(401);

    expect(response.body.message).toContain('You are not allowed to promote this user');
  });

  it('should NOT allow an OWNER to promote another user to OWNER', async () => {
    const response = await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${tenantUserId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    expect(response.body.message).toContain('needs a valid role');
  });

  it('should NOT allow promoting a user who is already OWNER', async () => {
    const response = await request(app.getHttpServer())
      .post(`/auth/promoteToOwner/${otherUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(401);

    expect(response.body.message).toBe(`User already has role OWNER`);
  });
});
