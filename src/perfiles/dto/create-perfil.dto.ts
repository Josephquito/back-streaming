//src/perfiles/dto/create-perfil.dto.ts
import { IsInt, IsNumber, IsDateString, IsString, Min } from 'class-validator';

export class CreatePerfilDto {
  @IsInt()
  cuentaId: number;

  @IsInt()
  clienteId: number;

  @IsDateString()
  fecha_venta: string;

  @IsString()
  tiempo_asignado: string;

  @IsNumber()
  @Min(0)
  precio: number;
}
