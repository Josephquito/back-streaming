import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Perfil } from 'src/entities/perfil.entity';
import { Cuenta } from 'src/entities/cuenta.entity';
import { EgresoFijo } from '../egresos-fijos/entities/egreso-fijo.entity';
import { CompraInversion } from '../compras-inversiones/entities/compra-inversion.entity';
import { Perdida } from '../perdidas/entities/perdida.entity';

@Injectable()
export class LiquidezService {
  constructor(
    @InjectRepository(Cuenta)
    private readonly cuentaRepo: Repository<Cuenta>,

    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,

    @InjectRepository(EgresoFijo)
    private readonly egresoFijoRepo: Repository<EgresoFijo>,

    @InjectRepository(CompraInversion)
    private readonly compraRepo: Repository<CompraInversion>,

    @InjectRepository(Perdida)
    private readonly perdidaRepo: Repository<Perdida>,
  ) {}

  async calcularLiquidez(
    negocioId: number,
    desde?: string,
    hasta?: string,
  ): Promise<{
    ganciaEmpresa: number;
    egresos: number;
    liquidez: number;
  }> {
    const cuentas = await this.cuentaRepo.find({ where: { negocioId } });
    const cuentaIds = cuentas.map((c) => c.id);

    if (cuentaIds.length === 0) {
      return { ganciaEmpresa: 0, egresos: 0, liquidez: 0 };
    }

    const addOneDay = (dateStr: string) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    };

    const rangoFechas =
      desde && hasta
        ? Between(new Date(desde), new Date(addOneDay(hasta)))
        : undefined;

    // ✅ Perfiles vendidos
    const perfilWhere = {
      cuentaId: In(cuentaIds),
      ...(rangoFechas ? { fecha_venta: rangoFechas } : {}),
    };

    const perfiles = await this.perfilRepo.find({ where: perfilWhere });

    const ganciaEmpresa = perfiles.reduce(
      (acc, perfil) => acc + Number(perfil.para_negocio),
      0,
    );

    // ✅ Egresos fijos
    const egresosFijos = await this.egresoFijoRepo.find({
      where: {
        negocio: { id: negocioId },
        ...(rangoFechas ? { fecha_creacion: rangoFechas } : {}),
      } as any,
    });

    // ✅ Compras
    const compras = await this.compraRepo.find({
      where: {
        negocio: { id: negocioId },
        ...(rangoFechas ? { fecha_creacion: rangoFechas } : {}),
      } as any,
    });

    // ✅ Pérdidas
    const perdidas = await this.perdidaRepo.find({
      where: {
        negocio: { id: negocioId },
        ...(rangoFechas ? { fecha_creacion: rangoFechas } : {}),
      } as any,
    });

    const egresos =
      egresosFijos.reduce((acc, e) => acc + Number(e.valor), 0) +
      compras.reduce((acc, c) => acc + Number(c.valor), 0) +
      perdidas.reduce((acc, p) => acc + Number(p.valor), 0);

    const liquidez = ganciaEmpresa - egresos;

    return { ganciaEmpresa, egresos, liquidez };
  }
}
