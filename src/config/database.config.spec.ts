import { Test, type TestingModule } from "@nestjs/testing"
import { ConfigService } from "@nestjs/config"
import { DatabaseConfigService } from "./database.config"
import type { TypeOrmModuleOptions } from "@nestjs/typeorm"

describe("DatabaseConfigService", () => {
  let service: DatabaseConfigService
  let configService: ConfigService

  const mockConfigService = {
    get: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<DatabaseConfigService>(DatabaseConfigService)
    configService = module.get<ConfigService>(ConfigService)

    jest.clearAllMocks()
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("createTypeOrmOptions", () => {
    it("should return PostgreSQL configuration with values from ConfigService", () => {
      const mockDbConfig = {
        DB_HOST: "localhost",
        DB_PORT: 5432,
        POSTGRES_DB: "testdb",
        POSTGRES_USER: "testuser",
        POSTGRES_PASSWORD: "testpassword",
      }

      mockConfigService.get.mockImplementation((key: string) => mockDbConfig[key])

      const options: TypeOrmModuleOptions = service.createTypeOrmOptions()

      expect(options).toEqual({
        type: "postgres",
        host: "localhost",
        port: 5432,
        database: "testdb",
        username: "testuser",
        password: "testpassword",
        autoLoadEntities: true,
        synchronize: true,
      })

      expect(configService.get).toHaveBeenCalledWith("DB_HOST")
      expect(configService.get).toHaveBeenCalledWith("DB_PORT")
      expect(configService.get).toHaveBeenCalledWith("POSTGRES_DB")
      expect(configService.get).toHaveBeenCalledWith("POSTGRES_USER")
      expect(configService.get).toHaveBeenCalledWith("POSTGRES_PASSWORD")
    })

    it("should handle undefined values from ConfigService", () => {
      mockConfigService.get.mockReturnValue(undefined)

      const options: TypeOrmModuleOptions = service.createTypeOrmOptions()

      expect(options).toEqual({
        type: "postgres",
        host: undefined,
        port: undefined,
        database: undefined,
        username: undefined,
        password: undefined,
        autoLoadEntities: true,
        synchronize: true,
      })
    })

    it("should maintain autoLoadEntities and synchronize settings", () => {
      mockConfigService.get.mockReturnValue("any-value")

      const options: TypeOrmModuleOptions = service.createTypeOrmOptions()

      expect(options.autoLoadEntities).toBe(true)
      expect(options.synchronize).toBe(true)
    })
  })
})
