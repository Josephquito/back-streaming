import { IsString, IsOptional } from 'class-validator';

export class CreatePlataformaDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  color?: string;
}
