import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = 4000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(PORT);
  console.log(`server on : http://localhost:${PORT}`);
}

bootstrap();
