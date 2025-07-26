//src/cuentas/dto/create-cuenta.dto.ts
import {
  IsString,
  IsEmail,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateCuentaDto {
  @IsEmail()
  correo: string;

  @IsString()
  clave: string;

  @IsDateString()
  fecha_compra: string;

  @IsString()
  tiempo_asignado: string;

  @IsString()
  proveedor: string;

  @IsNumber()
  costo_total: number;

  @IsInt()
  @Min(1)
  numero_perfiles: number;

  @IsInt()
  plataformaId: number;

  @IsOptional()
  @IsBoolean()
  inhabilitada?: boolean;
}
