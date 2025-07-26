import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CrearEgresoDto {
  @IsString()
  @IsNotEmpty()
  detalle: string;

  @IsNumber()
  valor: number;
}
