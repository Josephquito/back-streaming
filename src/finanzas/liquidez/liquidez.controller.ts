// src/finanzas/liquidez/liquidez.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LiquidezService } from './liquidez.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsuarioActual } from 'src/auth/decorator/usuario.decorator';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('finanzas/liquidez')
export class LiquidezController {
  constructor(private readonly liquidezService: LiquidezService) {}

  @Get()
  async obtenerLiquidez(
    @UsuarioActual() usuario: JwtPayload,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.liquidezService.calcularLiquidez(
      usuario.negocioId!,
      desde,
      hasta,
    );
  }
}
