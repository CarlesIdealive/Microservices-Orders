import { 
    IsEnum, 
    IsUUID 
} from "class-validator";
import { OrderStatusList } from "../enums/order.enum";
import { OrderStatus } from "generated/prisma";

export class ChangeOrderStatusDto {
    @IsUUID()
    id: string;

    @IsEnum(OrderStatusList, {
        message: `status must be one of the following: ${OrderStatusList.join(', ')}`,
    })
    status: OrderStatus;
}   