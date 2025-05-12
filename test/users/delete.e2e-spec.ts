import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { User } from '../../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ValidRoles } from '../../src/auth/enums/valid-roles.enum';

describe('Users - Delete (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const adminUser = {
    email: `admin-delete-test-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Admin Delete',
    phone: '+573111111111',
    location: 'Admin Location',
  };

  const tenantUser = {
    email: `tenant-delete-test-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Tenant Delete',
    phone: '+573122222222',
    location: 'Tenant Location',
  };

  const otherTenantUser = {
    email: `other-tenant-delete-test-${Date.now()}@example.com`,
    password: 'Test1234',
    fullName: 'Other Tenant Delete',
    phone: '+573133333333',
    location: 'Other Location',
  };

  let adminToken: string;
  let tenantToken: string;
  let otherTenantToken: string;

  let adminUserId: string;
  let tenantUserId: string;
  let otherTenantUserId: string;

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

    const httpServer = app.getHttpServer();

    // Register users
    const admin = await request(httpServer).post('/auth/register').send(adminUser);
    const tenant = await request(httpServer).post('/auth/register').send(tenantUser);
    const otherTenant = await request(httpServer).post('/auth/register').send(otherTenantUser);

    adminUserId = admin.body.user.id;
    tenantUserId = tenant.body.user.id;
    otherTenantUserId = otherTenant.body.user.id;

    await userRepository.update(adminUserId, {
      roles: [ValidRoles.ADMIN],
    });

    // Login users
    const adminLogin = await request(httpServer).post('/auth/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });

    const tenantLogin = await request(httpServer).post('/auth/login').send({
      email: tenantUser.email,
      password: tenantUser.password,
    });

    const otherTenantLogin = await request(httpServer).post('/auth/login').send({
      email: otherTenantUser.email,
      password: otherTenantUser.password,
    });

    adminToken = adminLogin.body.token;
    tenantToken = tenantLogin.body.token;
    otherTenantToken = otherTenantLogin.body.token;
  }, 10000);

  afterAll(async () => {
    await userRepository.delete({ id: adminUserId });
    await userRepository.delete({ id: tenantUserId });
    await userRepository.delete({ id: otherTenantUserId });
    await app.close();
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/${tenantUserId}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Unauthorized');
  });

  it('tenant cannot delete admin', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/${adminUserId}`)
      .set('Authorization', `Bearer ${tenantToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe('You are not allowed to remove this user');
  });

  it('admin can delete a tenant', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/${tenantUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(`User with ID ${tenantUserId} has been deactivated`);
  });

  it('tenant can delete itself', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/users/${otherTenantUserId}`)
      .set('Authorization', `Bearer ${otherTenantToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(`User with ID ${otherTenantUserId} has been deactivated`);
  });


  it('should return 404 if user not found or already inactive', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await request(app.getHttpServer())
      .delete(`/users/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe(`User with ID ${fakeId} not found or already inactive`);
  });
});
