import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { CreateOrderDto } from './dto/create-order.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto, PaginationOrderDto } from './dto';
import { PRODUCT_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{
  private readonly logger : Logger = new Logger(OrdersService.name);

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }


  async create(createOrderDto: CreateOrderDto) {
    try {

      //1.- Validamosla existencia de los productos 
      const ids = createOrderDto.items.map((item) => item.productId);
      const products = await firstValueFrom(
        this.productsClient.send({ cmd: 'validate'}, ids)
      )
      //2.- Calculamos valores totales de la Orden
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        //Buscamos el precio del producto de la BDs no del modelDTO
        const price = products.find((product) => product.id === orderItem.productId).price;
        return price * orderItem.quantity + acc;
      }, 0);
      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        //Buscamos el total de articulos de la Orden
        return acc + orderItem.quantity;
      }, 0);

      //4.-Graba la orden en la base de datos - Con una Transacción de Ordenes y Detalles de Ordenes
      //Prisma realiza la transaccion automaticamente al tener una relacion
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: products.find((product) => product.id === item.productId).price,
              })),
            },
          }
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          },
        }
      });
      return {
        ...order,
        OrderItem: order.OrderItem.map((item) => ({
          ...item,
          name: products.find((product) => product.id === item.productId).name,
        })),
      };

    } catch (error) {
      this.logger.error('Error creating order', error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Error creating order - check logs',
      });
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
    try {
      
      const order =await this.order.findFirst({
        where: {
          id: id
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          },
        }
      });
      //Validamos la existencia de la orden
      if (!order) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Order not found',
          error: `Order with id ${id} not found`
        });
      }

      //Encontramos el nomnbre de los Items - Productos
      const productIds = order.OrderItem.map((item) => item.productId);
      const products = await firstValueFrom(  //convierte Observable en Promesa
        this.productsClient.send({ cmd: 'validate'}, productIds)
      )
      order.OrderItem = order.OrderItem.map((item) => ({
        ...item,
        name: products.find((product) => product.id === item.productId).name,
      }));
      return order;

    } catch (error) {
      this.logger.error('Error finding order', error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error finding order',
        error: error.message
      });
      
    }

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
