// ventas.controller.ts
import { Controller, Get } from '@nestjs/common';
import { VentasService } from './ventas.service';

@Controller('finanzas/ventas')
export class VentasController {
  constructor(private readonly service: VentasService) {}

  @Get()
  listarVentas() {
    return this.service.listarVentas();
  }
}
