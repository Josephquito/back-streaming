import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';

export enum RolUsuario {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  EMPLEADO = 'empleado',
}

export class RegisterDto {
  @IsString()
  nombre: string;

  @IsString()
  apellido: string;

  @IsEmail()
  correo: string;

  @IsString()
  clave: string;

  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @IsOptional()
  cedula?: string;

  @IsOptional()
  telefono?: string;

  @IsOptional()
  telefono_respaldo?: string;
}
