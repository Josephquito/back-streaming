import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompraInversion } from './entities/compra-inversion.entity';
import { CrearCompraDto } from './dto/crear-compra.dto';

@Injectable()
export class ComprasInversionesService {
  constructor(
    @InjectRepository(CompraInversion)
    private readonly repo: Repository<CompraInversion>,
  ) {}

  crear(dto: CrearCompraDto, negocioId: number) {
    const compra = this.repo.create({ ...dto, negocioId });
    return this.repo.save(compra);
  }

  findAll(negocioId: number) {
    return this.repo.find({ where: { negocioId } });
  }

  eliminar(id: number, negocioId: number) {
    return this.repo.delete({ id, negocioId });
  }

  async calcularTotal(negocioId: number): Promise<number> {
    const compras = await this.repo.find({ where: { negocioId } });
    return compras.reduce((acc, item) => acc + Number(item.valor), 0);
  }
}
