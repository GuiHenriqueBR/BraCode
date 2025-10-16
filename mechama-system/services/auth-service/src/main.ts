import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { logger } from '@mechama/shared';
import { SERVICE_PORTS } from '@mechama/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.PORT || SERVICE_PORTS.AUTH_SERVICE;
  
  await app.listen(port);
  
  logger.info(`Auth Service running on port ${port}`);
}

bootstrap().catch((error) => {
  logger.error('Failed to start Auth Service', error);
  process.exit(1);
});