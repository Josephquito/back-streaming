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
import { EgresosFijosService } from './egresos-fijos.service';
import { CrearEgresoDto } from './dto/crear-egreso.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsuarioActual } from 'src/auth/decorator/usuario.decorator';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('finanzas/egresos-fijos')
export class EgresosFijosController {
  constructor(private readonly service: EgresosFijosService) {}

  @Post()
  crear(@Body() dto: CrearEgresoDto, @UsuarioActual() usuario: JwtPayload) {
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
