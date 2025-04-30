import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PRODUCT_SERVICE, envs } from 'src/config';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    //Microservices Declaration to exchange information with other microservices
    ClientsModule.register([
      {
        //MS Declaration 
        name: PRODUCT_SERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.productsMsHost,
          port: envs.productsMsPort,
        },
      }
    ]),
    
  ],
})
export class OrdersModule {}
