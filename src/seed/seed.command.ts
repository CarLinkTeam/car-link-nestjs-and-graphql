import { Command, CommandRunner } from 'nest-commander';
import { SeedService } from './seed.service';

@Command({
  name: 'seed',
  description: 'Seed the database with initial data',
})
export class SeedCommand extends CommandRunner {
  constructor(private readonly seedService: SeedService) {
    super();
  }

  async run(): Promise<void> {
    console.log('Starting database seeding...');
    try {
      await this.seedService.seedDatabase();
      console.log('✅ Database seeded successfully!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('❌ Error:', error.message);
      } else {
        console.error('❌ Unknown error:', String(error));
      }
      process.exit(1);
    }
  }
}
