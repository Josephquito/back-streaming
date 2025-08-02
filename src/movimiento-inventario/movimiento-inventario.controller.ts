import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import { MovimientoInventarioService } from './movimiento-inventario.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsuarioActual } from 'src/auth/decorator/usuario.decorator';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { MovimientoInventario } from 'src/entities/movimiento-inventario.entity';

@UseGuards(JwtAuthGuard)
@Controller('movimiento-inventario')
export class MovimientoInventarioController {
  constructor(private readonly service: MovimientoInventarioService) {}

  /**
   * Registrar un nuevo movimiento (entrada o salida)
   */
  @Post()
  registrarMovimiento(@Body() data: Partial<MovimientoInventario>) {
    return this.service.registrarMovimiento(data);
  }

  /**
   * Obtener todos los movimientos del negocio autenticado
   */
  @Get()
  getMovimientos(@UsuarioActual() usuario: JwtPayload) {
    const negocioId = usuario.negocioId;
    if (!negocioId) {
      throw new UnauthorizedException(
        'Tu cuenta no está asociada a un negocio.',
      );
    }
    return this.service.obtenerPorNegocio(negocioId);
  }

  @Get(':plataformaId')
  getPorPlataforma(
    @Param('plataformaId', ParseIntPipe) plataformaId: number,
    @UsuarioActual() usuario: JwtPayload,
  ) {
    const negocioId = usuario.negocioId;
    if (!negocioId) {
      throw new UnauthorizedException(
        'Tu cuenta no está asociada a un negocio.',
      );
    }
    return this.service.obtenerPorPlataforma(plataformaId, negocioId);
  }

  /**
   * Eliminar todos los movimientos (usar solo para pruebas)
   */
  @Delete('eliminar-todo')
  eliminarTodos() {
    return this.service.eliminarTodos();
  }
}
