import { IsString, IsNotEmpty, IsNumber, IsIn } from 'class-validator';

export class CrearPerdidaDto {
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsString()
  @IsIn(['reembolso', 'estafa', 'garantía']) //observacion
  tipo: 'reembolso' | 'estafa' | 'garantía';

  @IsNumber()
  valor: number;
}
