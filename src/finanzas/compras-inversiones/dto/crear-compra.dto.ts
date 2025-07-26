import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CrearCompraDto {
  @IsString()
  @IsNotEmpty()
  detalle: string;

  @IsNumber()
  valor: number;
}
