import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

  // Global prefix for all REST routes
  app.setGlobalPrefix('api');

  // CORS configuration
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global Validation Pipe with whitelist & transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global exception filter for secure and consistent error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(port);
  logger.log(`=========================================`);
  logger.log(` Chat Room Backend Server running! `);
  logger.log(` REST API: http://localhost:${port}/api `);
  logger.log(` WebSocket Gateway: ws://localhost:${port} `);
  logger.log(` Configured Frontend URL: ${frontendUrl} `);
  logger.log(`=========================================`);
}
bootstrap();
