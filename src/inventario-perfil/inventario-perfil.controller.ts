import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { InventarioPerfilService } from './inventario-perfil.service';
import { EntradaInventarioDto } from './dto/entrada-inventario.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsuarioActual } from 'src/auth/decorator/usuario.decorator';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { UnauthorizedException } from '@nestjs/common/exceptions/unauthorized.exception';

@UseGuards(JwtAuthGuard)
@Controller('inventario-perfil')
export class InventarioPerfilController {
  constructor(private readonly service: InventarioPerfilService) {}

  @Post('entrada')
  registrarEntrada(@Body() dto: EntradaInventarioDto) {
    return this.service.registrarEntrada(dto);
  }

  @Post('salida')
  registrarSalida(
    @Query('plataformaId') plataformaId: number,
    @Query('negocioId') negocioId: number,
  ) {
    return this.service.registrarSalida(
      Number(plataformaId),
      Number(negocioId),
    );
  }

  @Get()
  obtenerInventario(@Query('negocioId') negocioId: number) {
    return this.service.obtenerInventario(Number(negocioId));
  }

  // NUEVO: Obtener inventario de una plataforma para el negocio autenticado
  @Get(':plataformaId')
  getPorPlataforma(
    @Param('plataformaId', ParseIntPipe) plataformaId: number,
    @UsuarioActual() usuario: JwtPayload,
  ) {
    if (!usuario.negocioId) {
      throw new UnauthorizedException(
        'Tu cuenta no está asociada a un negocio.',
      );
    }

    return this.service.obtenerPorPlataforma(plataformaId, usuario.negocioId);
  }
}
