// src/cuentas/cuentas.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  InternalServerErrorException,
  ConflictException,
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import { CuentasService } from './cuentas.service';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import { Cuenta } from '../entities/cuenta.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UsuarioActual } from '../auth/decorator/usuario.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { ReemplazoCuentaDto } from './dto/reemplazo-cuenta.dto';

@UseGuards(JwtAuthGuard)
@Controller('cuentas')
export class CuentasController {
  constructor(private readonly cuentasService: CuentasService) {}

  // Crear cuenta
  @Post()
  async create(
    @Body() dto: CreateCuentaDto,
    @UsuarioActual() usuario: JwtPayload,
  ): Promise<Cuenta> {
    try {
      return await this.cuentasService.create(dto, usuario);
    } catch (error) {
      console.error('❌ Error al crear cuenta:', error);

      if (error instanceof ConflictException) throw error;

      throw new InternalServerErrorException(
        'Error interno al crear la cuenta.',
      );
    }
  }

  // Listar cuentas del negocio del usuario autenticado
  @Get('negocio')
  async findByNegocio(@UsuarioActual() usuario: JwtPayload): Promise<any[]> {
    return this.cuentasService.findByNegocioUsuario(usuario);
  }

  // Obtener una cuenta por ID (verifica que sea del mismo negocio)
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: JwtPayload,
  ): Promise<Cuenta> {
    return this.cuentasService.findOneByNegocio(id, usuario);
  }

  // Actualizar cuenta
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCuentaDto,
  ): Promise<Cuenta> {
    return this.cuentasService.update(id, dto);
  }

  @Patch('reemplazar/:id')
  reemplazarCuenta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReemplazoCuentaDto,
    @UsuarioActual() usuario: JwtPayload,
  ) {
    return this.cuentasService.reemplazarCuenta(id, dto, usuario);
  }

  @Get('disponibles/reemplazo/:plataformaId')
  getCuentasDisponiblesParaReemplazo(
    @Param('plataformaId', ParseIntPipe) plataformaId: number,
    @UsuarioActual() usuario: JwtPayload,
  ) {
    if (!usuario.negocioId) {
      throw new UnauthorizedException('Falta el negocio del usuario');
    }

    return this.cuentasService.buscarCuentasDisponiblesParaReemplazo(
      usuario.negocioId,
      plataformaId,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioActual() usuario: JwtPayload,
  ): Promise<{ message: string }> {
    await this.cuentasService.remove(id, usuario);
    return { message: 'Cuenta eliminada correctamente' };
  }
}
