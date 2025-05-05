import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';

async function bootstrap() {
  if (
    process.argv.includes('seed') ||
    process.argv.some((arg) => arg.includes('command'))
  ) {
    await CommandFactory.run(AppModule, {
      logger: ['error', 'warn', 'log'],
      serviceErrorHandler: (err) => {
        console.error('Command error:', err);
        process.exit(1);
      },
    });
  } else {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.listen(process.env.PORT ?? 3000);
  }
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
