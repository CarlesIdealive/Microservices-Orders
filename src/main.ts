import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { envs } from './config';

async function bootstrap() {
  const logger = new Logger('ORDERS_MICROSERVICE');  

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport: Transport.TCP,
    options: {
      port: envs.port,
    },    
  });


  await app.listen();
  logger.log(`Orders microservice is running on port ${envs.port}`);
}
bootstrap();
