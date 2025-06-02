import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

    app.enableCors({
      origin: true,
      credentials: true,
    });


    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('CarLink RESTFul API')
      .setDescription('Car rental management endpoints')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    await app.listen(process.env.PORT ?? 3000);
  }
}

bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
