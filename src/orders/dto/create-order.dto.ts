import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive } from "class-validator";
import { OrderStatus } from "generated/prisma";
import { OrderStatusList } from "../enums/order.enum";

export class CreateOrderDto {

    @IsNumber()
    @IsPositive()
    readonly totalAmount: number;

    @IsNumber()
    @IsPositive()
    readonly totalItems: number;
    
    @IsEnum(OrderStatusList, {
        message: `Status must be one of the following: ${Object.values(OrderStatusList).join(', ')}`,
    })
    @IsOptional()
    readonly status: OrderStatus = OrderStatus.PENDING;
    
    @IsBoolean()
    @IsOptional()
    readonly paid: boolean = false;

}
