import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MovimientoInventario } from 'src/entities/movimiento-inventario.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MovimientoInventarioService {
  constructor(
    @InjectRepository(MovimientoInventario)
    private readonly repo: Repository<MovimientoInventario>,
  ) {}

  /**
   * Registra un nuevo movimiento de inventario.
   * Puede ser una entrada (compra, reemplazo) o una salida (venta, baja).
   */
  async registrarMovimiento(data: Partial<MovimientoInventario>) {
    const movimiento = this.repo.create(data);
    return this.repo.save(movimiento);
  }

  /**
   * Retorna todos los movimientos de un negocio ordenados por fecha.
   */
  async obtenerPorNegocio(negocioId: number) {
    return this.repo.find({
      where: { negocioId },
      order: { fecha: 'ASC' },
      relations: ['plataforma'],
    });
  }

  /**
   * Retorna los movimientos filtrados por plataforma y negocio.
   */
  async obtenerPorPlataforma(
    plataformaId: number,
    negocioId: number,
  ): Promise<MovimientoInventario[]> {
    return this.repo.find({
      where: { plataformaId, negocioId },
      order: { fecha: 'ASC' },
      relations: ['plataforma'],
    });
  }

  /**
   * Elimina todos los movimientos (uso restringido).
   */
  async eliminarTodos(): Promise<void> {
    await this.repo.clear();
  }
}
