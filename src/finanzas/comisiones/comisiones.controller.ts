// src/finanzas/comisiones/comisiones.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { ComisionesService } from './comisiones.service';

@Controller('finanzas/comisiones')
export class ComisionesController {
  constructor(private readonly service: ComisionesService) {}

  @Get()
  async obtenerResumen(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.service.obtenerComisiones(desde, hasta);
  }
}
