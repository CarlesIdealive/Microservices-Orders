import { IsEnum, IsOptional } from "class-validator";
import { OrderStatusList } from "../enums/order.enum";
import { PaginationDto } from "src/common/dtos/dtos";
import { OrderStatus } from "generated/prisma/client";

export class PaginationOrderDto extends PaginationDto{

    @IsOptional()
    @IsEnum(OrderStatusList, {
        message: `Status must be one of the following: ${Object.values(OrderStatusList).join(', ')}`,   
    })
    readonly status?: OrderStatus;


}