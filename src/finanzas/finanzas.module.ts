import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EgresoFijo } from './egresos-fijos/entities/egreso-fijo.entity';
import { EgresosFijosService } from './egresos-fijos/egresos-fijos.service';
import { EgresosFijosController } from './egresos-fijos/egresos-fijos.controller';
import { ComprasInversionesController } from './compras-inversiones/compras-inversiones.controller';
import { ComprasInversionesService } from './compras-inversiones/compras-inversiones.service';
import { CompraInversion } from './compras-inversiones/entities/compra-inversion.entity';
import { Perdida } from './perdidas/entities/perdida.entity';
import { PerdidasController } from './perdidas/perdidas.controller';
import { PerdidasService } from './perdidas/perdidas.service';
import { ComisionesController } from './comisiones/comisiones.controller';
import { ComisionesService } from './comisiones/comisiones.service';
import { Perfil } from 'src/entities/perfil.entity';
import { LiquidezController } from './liquidez/liquidez.controller';
import { LiquidezService } from './liquidez/liquidez.service';
import { CuentasModule } from 'src/cuentas/cuentas.module'; // Asegúrate de que la ruta sea correcta

@Module({
  imports: [
    TypeOrmModule.forFeature([EgresoFijo, CompraInversion, Perdida, Perfil]),
    CuentasModule,
  ],
  controllers: [
    EgresosFijosController,
    ComprasInversionesController,
    PerdidasController,
    ComisionesController,
    LiquidezController,
  ],
  providers: [
    EgresosFijosService,
    ComprasInversionesService,
    PerdidasService,
    ComisionesService,
    LiquidezService,
  ],
})
export class FinanzasModule {}
