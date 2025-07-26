//src/cuentas/cuentas.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  ParseIntPipe,
  ConflictException,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { CuentasService } from './cuentas.service';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { Cuenta } from '../entities/cuenta.entity';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import { UsuarioActual } from '../auth/decorator/usuario.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';

@UseGuards(JwtAuthGuard)
@Controller('cuentas')
export class CuentasController {
  constructor(private readonly cuentasService: CuentasService) {}

  // Crear cuenta
  @Post()
  async create(
    @Body() dto: CreateCuentaDto,
    @UsuarioActual() usuario: JwtPayload,
  ) {
    try {
      return await this.cuentasService.create(dto, usuario);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('No se pudo crear la cuenta.');
    }
  }

  // Listar cuentas del negocio del admin autenticado
  @Get('negocio')
  async findByNegocio(@UsuarioActual() usuario: JwtPayload): Promise<Cuenta[]> {
    return this.cuentasService.findByNegocioUsuario(usuario);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: JwtPayload,
  ): Promise<Cuenta> {
    return this.cuentasService.findOneByNegocio(id, usuario);
  }

  // Actualizar
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCuentaDto,
  ): Promise<Cuenta> {
    return this.cuentasService.update(id, dto);
  }

  // Eliminar
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.cuentasService.remove(id);
    return { message: 'Cuenta eliminada correctamente' };
  }
  @Get('disponibles')
  async cuentasDisponibles(
    @UsuarioActual() usuario: JwtPayload,
  ): Promise<any[]> {
    return this.cuentasService.obtenerCuentasDisponibles(usuario);
  }
}
