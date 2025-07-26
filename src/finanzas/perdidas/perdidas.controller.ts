import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { PerdidasService } from './perdidas.service';
import { CrearPerdidaDto } from './dto/crear-perdida.dto';

@Controller('finanzas/perdidas')
export class PerdidasController {
  constructor(private readonly service: PerdidasService) {}

  @Post()
  crear(@Body() dto: CrearPerdidaDto) {
    return this.service.crear(dto);
  }

  @Get()
  listar() {
    return this.service.findAll();
  }

  @Delete(':id')
  eliminar(@Param('id') id: number) {
    return this.service.eliminar(id);
  }

  @Get('total')
  calcularTotal() {
    return this.service.calcularTotal();
  }
}
