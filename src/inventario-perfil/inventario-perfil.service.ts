import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InventarioPerfil } from 'src/entities/inventario-perfil.entity';
import { Repository } from 'typeorm';
import { EntradaInventarioDto } from './dto/entrada-inventario.dto';
import { BadRequestException } from '@nestjs/common';
import { MovimientoInventarioService } from 'src/movimiento-inventario/movimiento-inventario.service';

@Injectable()
export class InventarioPerfilService {
  constructor(
    @InjectRepository(InventarioPerfil)
    private readonly repo: Repository<InventarioPerfil>,
    private readonly movimientoInventarioService: MovimientoInventarioService,
  ) {}

  async registrarEntrada(dto: EntradaInventarioDto) {
    const { plataformaId, negocioId, perfiles, costoTotal } = dto;

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

    let inventario = await this.repo.findOne({
      where: { plataformaId, negocioId },
    });

    const costo_unitario = costoTotal / perfiles;

    if (!inventario) {
      const nuevo = this.repo.create({
        plataformaId,
        negocioId,
        stock_perfiles: perfiles,
        costo_promedio: costo_unitario,
        valor_total: costoTotal,
      });

      inventario = await this.repo.save(nuevo);
    } else {
      const stockAnterior = inventario.stock_perfiles;
      const costoAnterior = inventario.costo_promedio;
      const nuevoStock = stockAnterior + perfiles;
      const nuevoCostoPromedio =
        (stockAnterior * costoAnterior + costoTotal) / nuevoStock;

      inventario.stock_perfiles = nuevoStock;
      inventario.costo_promedio = nuevoCostoPromedio;
      inventario.valor_total = nuevoStock * nuevoCostoPromedio;

      inventario = await this.repo.save(inventario);
    }

    // Registrar movimiento de entrada
    await this.movimientoInventarioService.registrarMovimiento({
      plataformaId,
      negocioId,
      descripcion: dto.descripcion ?? 'Entrada al inventario',
      entrada_cant: perfiles,
      entrada_pu: costo_unitario,
      entrada_pt: costoTotal,
      saldo_cant: inventario.stock_perfiles,
      saldo_pu: inventario.costo_promedio,
      saldo_pt: inventario.valor_total,
    });

    return inventario;
  }

  async registrarSalida(
    plataformaId: number,
    negocioId: number,
    perfiles: number = 1,
    descripcion?: string,
  ) {
    const inventario = await this.repo.findOne({
      where: { plataformaId, negocioId },
    });

    if (!inventario || inventario.stock_perfiles < perfiles) {
      throw new Error('No hay suficiente inventario disponible');
    }

    const costo_unitario = inventario.costo_promedio;
    const totalSalida = perfiles * costo_unitario;

    inventario.stock_perfiles -= perfiles;
    inventario.valor_total =
      inventario.stock_perfiles * inventario.costo_promedio;

    const actualizado = await this.repo.save(inventario);

    // Registrar movimiento de salida
    await this.movimientoInventarioService.registrarMovimiento({
      plataformaId,
      negocioId,
      descripcion: descripcion ?? 'Salida por venta o uso de perfiles',
      salida_cant: perfiles,
      salida_pu: costo_unitario,
      salida_pt: totalSalida,
      saldo_cant: actualizado.stock_perfiles,
      saldo_pu: actualizado.costo_promedio,
      saldo_pt: actualizado.valor_total,
    });

    return actualizado;
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
