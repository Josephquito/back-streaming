import {
  IsString,
  IsEmail,
  IsDateString,
  IsNumber,
  IsInt,
  IsIn,
  ValidateIf,
} from 'class-validator';

export class ReemplazoCuentaDto {
  @IsEmail()
  nuevoCorreo: string;

  @IsString()
  nuevaClave: string;

  @IsIn(['PROVEEDOR', 'COMPRA_NUEVA', 'COMPRA_EXISTENTE'])
  tipo: 'PROVEEDOR' | 'COMPRA_NUEVA' | 'COMPRA_EXISTENTE';

  // Solo requerido si tipo === 'COMPRA_NUEVA'
  @ValidateIf((o) => o.tipo === 'COMPRA_NUEVA')
  @IsInt()
  proveedor: string;

  @ValidateIf((o) => o.tipo === 'COMPRA_NUEVA')
  @IsDateString()
  fecha_compra: string;

  @ValidateIf((o) => o.tipo === 'COMPRA_NUEVA')
  @IsNumber()
  costo: number;

  @ValidateIf((o) => o.tipo === 'COMPRA_NUEVA')
  @IsString()
  tiempo_establecido: string;

  // Solo requerido si tipo === 'COMPRA_EXISTENTE'
  @ValidateIf((o) => o.tipo === 'COMPRA_EXISTENTE')
  @IsInt()
  cuentaExistenteId: number;
}
