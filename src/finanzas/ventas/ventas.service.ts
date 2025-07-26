// ventas.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Perfil } from 'src/entities/perfil.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
  ) {}

  async listarVentas() {
    const perfiles = await this.perfilRepo.find();

    return perfiles.map((perfil) => ({
      id: perfil.id,
      producto: `${perfil.cuenta.plataforma.nombre} - ${perfil.tiempo_asignado}`,
      plataforma: perfil.cuenta.plataforma,
      precio_venta: perfil.precio,
      costo: perfil.costo,
      ganancia: perfil.ganancia,
      vendedor: perfil.usuario?.nombre || 'Desconocido',
      fecha_venta: perfil.fecha_venta,
      fecha_insercion: perfil.fecha_insercion,
    }));
  }
}
