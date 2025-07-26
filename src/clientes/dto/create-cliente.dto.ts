// src/clientes/dto/create-cliente.dto.ts
import { IsString } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  nombre: string;

  @IsString()
  contacto: string;

  @IsString()
  clave: string;
}
