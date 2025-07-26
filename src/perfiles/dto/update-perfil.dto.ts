import {
  IsOptional,
  IsDateString,
  IsNumber,
  IsString,
  Min,
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
}
