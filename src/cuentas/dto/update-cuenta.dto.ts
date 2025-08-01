import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class UpdateCuentaDto {
  @IsOptional()
  @IsString()
  clave?: string;

  @IsOptional()
  @IsNumber()
  costo_total?: number;

  @IsOptional()
  @IsString()
  tiempo_asignado?: string;

  @IsOptional()
  @IsDateString()
  fecha_compra?: string;

  @IsOptional()
  @IsDateString()
  fecha_corte?: string;

  @IsOptional()
  @IsString()
  proveedor?: string;

  @IsOptional()
  @IsNumber()
  numero_perfiles?: number;

  @IsOptional()
  plataformaId?: number;

  @IsOptional()
  @IsBoolean()
  inhabilitada?: boolean;
}
