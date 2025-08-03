import {
  IsOptional,
  IsDateString,
  IsNumber,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';

export class UpdatePerfilDto {
  @IsOptional()
  @IsDateString()
  fecha_venta?: string;

  @IsOptional()
  @IsString()
  tiempo_asignado?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precio?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean; // 👈 esto permite cambiar el estado

  @IsOptional()
  @IsDateString()
  fecha_baja?: string;
}
