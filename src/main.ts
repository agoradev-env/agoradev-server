import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  // Validate required environment variables
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  // Set global API prefix
  app.setGlobalPrefix('api/v1');

  // Configure CORS
  configureCors(app);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger Configuration
  setupSwagger(app);

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API base URL: http://localhost:${port}/api/v1`);
  
  if (isSwaggerEnabled()) {
    logger.log(`Swagger documentation: http://localhost:${port}/docs`);
    logger.log(`To access from other devices, use your machine's IP address:`);
    logger.log(`  API: http://YOUR_IP:${port}/api/v1`);
    logger.log(`  Swagger: http://YOUR_IP:${port}/docs`);
  }
}

function validateEnvironment() {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Please check your .env file.'
    );
  }

  // Validate Swagger configuration if enabled
  if (isSwaggerEnabled()) {
    const swaggerUser = process.env.SWAGGER_USER;
    const swaggerPassword = process.env.SWAGGER_PASSWORD;

    if (!swaggerUser || !swaggerPassword) {
      throw new Error(
        'SWAGGER_ENABLED is true but SWAGGER_USER and SWAGGER_PASSWORD are not set. ' +
        'Please provide Swagger credentials or set SWAGGER_ENABLED=false.'
      );
    }
  }
}

function configureCors(app: any) {
  const corsOrigin = process.env.CORS_ORIGIN;
  
  if (!corsOrigin) {
    logger.warn('CORS_ORIGIN not set. Allowing no origins for security. Set CORS_ORIGIN in .env.');
    app.enableCors({
      origin: false,
    });
    return;
  }

  // Parse comma-separated origins
  const origins = corsOrigin
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  if (origins.length === 0) {
    logger.warn('CORS_ORIGIN is empty. Allowing no origins for security.');
    app.enableCors({ origin: false });
    return;
  }

  // Validate origins
  const validOrigins = origins.filter(origin => {
    try {
      new URL(origin);
      return true;
    } catch {
      logger.warn(`Invalid CORS origin: ${origin}. Skipping.`);
      return false;
    }
  });

  if (validOrigins.length === 0) {
    logger.warn('No valid CORS origins found. Allowing no origins for security.');
    app.enableCors({ origin: false });
    return;
  }

  app.enableCors({
    origin: validOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type,Authorization',
  });

  logger.log(`CORS enabled for origins: ${validOrigins.join(', ')}`);
}

function isSwaggerEnabled(): boolean {
  return process.env.SWAGGER_ENABLED === 'true';
}

function setupSwagger(app: any) {
  if (!isSwaggerEnabled()) {
    logger.log('Swagger documentation is disabled (SWAGGER_ENABLED=false)');
    return;
  }

  const swaggerUser = process.env.SWAGGER_USER!;
  const swaggerPassword = process.env.SWAGGER_PASSWORD!;

  // Protect Swagger routes with Basic Auth (both UI and JSON)
  const swaggerAuth = basicAuth({
    challenge: true,
    users: { [swaggerUser]: swaggerPassword },
  });

  // Apply Basic Auth to both Swagger routes
  app.use('/docs', swaggerAuth);
  app.use('/docs-json', swaggerAuth);

  const config = new DocumentBuilder()
    .setTitle('Agora API')
    .setDescription('Agora backend API documentation with authentication endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  logger.log('Swagger documentation enabled at /docs with Basic Auth protection');
  logger.log('Swagger JSON endpoint at /docs-json also protected');
}

bootstrap();
