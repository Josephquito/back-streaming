import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Configurar CORS
  app.enableCors({
    origin: ['http://localhost:4200', 'https://front-streaming.vercel.app'],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
