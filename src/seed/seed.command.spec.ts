import { Test, type TestingModule } from '@nestjs/testing';
import { SeedCommand } from './seed.command';
import { SeedService } from './seed.service';
import { jest } from '@jest/globals';

describe('SeedCommand', () => {
  let command: SeedCommand;
  let seedService: SeedService;

  const mockSeedService = {
    seedDatabase: jest.fn().mockImplementation(() => Promise.resolve()),
  };

  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalProcessExit = process.exit;

  beforeEach(async () => {
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn() as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedCommand,
        {
          provide: SeedService,
          useValue: mockSeedService,
        },
      ],
    }).compile();

    command = module.get<SeedCommand>(SeedCommand);
    seedService = module.get<SeedService>(SeedService);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(command).toBeDefined();
  });

  it('should call seedDatabase and log success message', async () => {
    mockSeedService.seedDatabase.mockImplementation(() => Promise.resolve());

    await command.run();

    expect(seedService.seedDatabase).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Starting database seeding...');
    expect(console.log).toHaveBeenCalledWith(
      '✅ Database seeded successfully!',
    );
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should handle error with message and exit with code 1', async () => {
    const testError = new Error('Test error message');
    mockSeedService.seedDatabase.mockImplementation(() =>
      Promise.reject(testError),
    );

    await command.run();

    expect(seedService.seedDatabase).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '❌ Error:',
      'Test error message',
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle unknown error and exit with code 1', async () => {
    const unknownError = 'Unknown error string';
    mockSeedService.seedDatabase.mockImplementation(() =>
      Promise.reject(unknownError),
    );

    await command.run();

    expect(seedService.seedDatabase).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '❌ Unknown error:',
      'Unknown error string',
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
