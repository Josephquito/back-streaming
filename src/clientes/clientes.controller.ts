// src/clientes/clientes.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Put,
  Delete,
  ParseIntPipe,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { UsuarioActual } from 'src/auth/decorator/usuario.decorator';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@Body() dto: CreateClienteDto, @UsuarioActual() usuario: JwtPayload) {
    return this.clientesService.create(dto, usuario);
  }

  @Get('mis-clientes')
  findByNegocio(@UsuarioActual() usuario: JwtPayload) {
    return this.clientesService.findByNegocio(usuario);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.remove(id);
  }

  @Get(':id/perfiles/activos')
  perfilesActivos(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.obtenerPerfilesActivos(id);
  }

  @Get(':id/perfiles/historial')
  historialPerfiles(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.obtenerHistorialPerfiles(id);
  }

  @Get('resumen/general')
  resumenClientes(@UsuarioActual() usuario: JwtPayload) {
    if (!usuario.negocioId) {
      throw new UnauthorizedException('No estás asociado a un negocio.');
    }
    return this.clientesService.obtenerResumenClientes(usuario.negocioId);
  }

  @Get('sin-compras')
  clientesNuncaCompraron(@UsuarioActual() usuario: JwtPayload) {
    if (!usuario.negocioId) {
      throw new UnauthorizedException('No estás asociado a un negocio.');
    }
    return this.clientesService.obtenerClientesNuncaCompraron(
      usuario.negocioId,
    );
  }
}
