import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { CreateOrderDto } from './dto/create-order.dto';
import { RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto, PaginationOrderDto } from './dto';


@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{
  private readonly logger : Logger = new Logger(OrdersService.name);
  
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }


  create(createOrderDto: CreateOrderDto) {
    try {
      const order = this.order.create({
        data: createOrderDto
      });
      return order;

    } catch (error) {
      this.logger.error('Error creating order', error);
      throw new Error('Error creating order');
    }
  }

  async findAll(paginationOrderDto: PaginationOrderDto) {
    const {take, skip, status} = paginationOrderDto;
    const totalRegisters = await this.order.count({
      where:{
        status: status
      }
    }).catch((error) => {
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error counting orders',
        error: error.message
      });
    });

    const orders =await this.order.findMany({
      take: take,
      skip: skip,
      where: {
        status: status
      },
      orderBy: {
        createdAt: 'desc'
      }
    }).catch((error) => {
      this.logger.error('Error fetching orders', error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error fetching orders',
        error: error.message
      });
    });

    return {
      data:orders,
      meta: {
        total: totalRegisters,
        perPage: take,
        pages: Math.ceil(totalRegisters / take!),
        currentPage: Math.ceil(skip! / take!) + 1,
        skip: skip,
        status,
      }
    };  
  }

  async findOne(id: string) {
    const order =await this.order.findFirst({
      where: {
        id: id
      }
    });
    
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'Order not found',
        error: `Order with id ${id} not found`
      });
    }
    return order;
  }


  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;
    const order = await this.findOne(id);
    if ( order.status === status) {
     return order
    }
    
    return this.order.update({
      where: {
        id: id
      },
      data: {
        status: status
      }
    }).catch((error) => {
      this.logger.error('Error updating order', error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error updating order',
        error: error.message
      });
    });
  }



}
