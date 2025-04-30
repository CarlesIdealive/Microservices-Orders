import { Type } from "class-transformer";
import { IsOptional, IsPositive, Min } from "class-validator";


export class PaginationDto {
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  take?: number = 100;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  skip?: number = 0;


}