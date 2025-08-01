import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InventarioPerfil } from 'src/entities/inventario-perfil.entity';
import { Repository } from 'typeorm';
import { EntradaInventarioDto } from './dto/entrada-inventario.dto';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class InventarioPerfilService {
  constructor(
    @InjectRepository(InventarioPerfil)
    private readonly repo: Repository<InventarioPerfil>,
  ) {}

  async registrarEntrada(dto: EntradaInventarioDto) {
    const { plataformaId, negocioId, perfiles, costoTotal } = dto;
    console.error('❌ registrarEntrada(): datos inválidos', {
      perfiles,
      costoTotal,
    });

    if (
      !Number.isFinite(perfiles) ||
      perfiles <= 0 ||
      !Number.isFinite(costoTotal) ||
      costoTotal < 0
    ) {
      throw new BadRequestException(
        'Datos inválidos: perfiles o costoTotal incorrectos',
      );
    }

    const inventario = await this.repo.findOne({
      where: { plataformaId, negocioId },
    });

    if (!inventario) {
      const costo_promedio = costoTotal / perfiles;
      return this.repo.save({
        plataformaId,
        negocioId,
        stock_perfiles: perfiles,
        costo_promedio,
        valor_total: costoTotal,
      });
    }

    const stockAnterior = inventario.stock_perfiles;
    const costoAnterior = inventario.costo_promedio;
    const nuevoStock = stockAnterior + perfiles;

    const nuevoCostoPromedio =
      (stockAnterior * costoAnterior + costoTotal) / nuevoStock;

    inventario.stock_perfiles = nuevoStock;
    inventario.costo_promedio = nuevoCostoPromedio;
    inventario.valor_total = nuevoStock * nuevoCostoPromedio;

    return this.repo.save(inventario);
  }

  async registrarSalida(
    plataformaId: number,
    negocioId: number,
    perfiles: number = 1,
  ) {
    const inventario = await this.repo.findOne({
      where: { plataformaId, negocioId },
    });

    if (!inventario || inventario.stock_perfiles < perfiles) {
      throw new Error('No hay suficiente inventario disponible');
    }

    inventario.stock_perfiles -= perfiles;
    inventario.valor_total =
      inventario.stock_perfiles * inventario.costo_promedio;

    return this.repo.save(inventario);
  }

  async obtenerInventario(negocioId: number) {
    return this.repo.find({
      where: { negocioId },
    });
  }

  async obtenerPorPlataformaYNegocio(
    plataformaId: number,
    negocioId: number,
  ): Promise<InventarioPerfil | null> {
    return this.repo.findOne({
      where: { plataformaId, negocioId },
      relations: ['plataforma', 'negocio'],
    });
  }

  async obtenerPorPlataforma(plataformaId: number, negocioId: number) {
    return this.repo.findOne({
      where: { plataformaId, negocioId },
      relations: ['plataforma', 'negocio'],
    });
  }
}
