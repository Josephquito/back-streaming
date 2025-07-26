// src/finanzas/comisiones/comisiones.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Perfil } from 'src/entities/perfil.entity';
import { Repository } from 'typeorm';
import { RolUsuario } from 'src/entities/usuario.entity';

@Injectable()
export class ComisionesService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
  ) {}

  async obtenerComisiones(desde?: string, hasta?: string) {
    const query = this.perfilRepo
      .createQueryBuilder('perfil')
      .leftJoinAndSelect('perfil.usuario', 'usuario');

    if (desde && hasta) {
      query.andWhere('perfil.fecha_venta BETWEEN :desde AND :hasta', {
        desde,
        hasta,
      });
    }

    const perfiles = await query.getMany();

    const resumen = new Map<
      number,
      {
        usuarioId: number;
        nombre: string;
        rol: RolUsuario;
        total_ganado: number;
      }
    >();

    for (const p of perfiles) {
      const usuario = p.usuario;
      if (!usuario) continue;

      const yaExiste = resumen.get(usuario.id);
      const monto =
        usuario.rol === RolUsuario.ADMIN
          ? Number(p.para_admin)
          : Number(p.para_empleado);

      if (yaExiste) {
        yaExiste.total_ganado += monto;
      } else {
        resumen.set(usuario.id, {
          usuarioId: usuario.id,
          nombre: usuario.nombre,
          rol: usuario.rol,
          total_ganado: monto,
        });
      }
    }

    return Array.from(resumen.values());
  }
}
