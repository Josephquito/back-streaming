import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ComprasInversionesService } from './compras-inversiones.service';
import { CrearCompraDto } from './dto/crear-compra.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsuarioActual } from 'src/auth/decorator/usuario.decorator';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('finanzas/compras-inversiones')
export class ComprasInversionesController {
  constructor(private readonly service: ComprasInversionesService) {}

  @Post()
  crear(@Body() dto: CrearCompraDto, @UsuarioActual() usuario: JwtPayload) {
    if (!usuario.negocioId) {
      throw new BadRequestException('Falta negocioId en el token');
    }
    return this.service.crear(dto, usuario.negocioId);
  }

  @Get()
  listar(@UsuarioActual() usuario: JwtPayload) {
    if (!usuario.negocioId) {
      throw new BadRequestException('Falta negocioId en el token');
    }
    return this.service.findAll(usuario.negocioId);
  }

  @Delete(':id')
  eliminar(@Param('id') id: number, @UsuarioActual() usuario: JwtPayload) {
    if (!usuario.negocioId) {
      throw new BadRequestException('Falta negocioId en el token');
    }
    return this.service.eliminar(id, usuario.negocioId);
  }

  @Get('total')
  calcularTotal(@UsuarioActual() usuario: JwtPayload) {
    if (!usuario.negocioId) {
      throw new BadRequestException('Falta negocioId en el token');
    }
    return this.service.calcularTotal(usuario.negocioId);
  }
}
