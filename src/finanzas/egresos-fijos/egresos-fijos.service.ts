import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EgresoFijo } from './entities/egreso-fijo.entity';
import { CrearEgresoDto } from './dto/crear-egreso.dto';

@Injectable()
export class EgresosFijosService {
  constructor(
    @InjectRepository(EgresoFijo)
    private readonly repo: Repository<EgresoFijo>,
  ) {}

  // Crear egreso con negocioId
  crear(dto: CrearEgresoDto, negocioId: number) {
    const egreso = this.repo.create({ ...dto, negocio: { id: negocioId } });
    return this.repo.save(egreso);
  }

  // Listar solo egresos de ese negocio
  findAll(negocioId: number) {
    return this.repo.find({
      where: { negocio: { id: negocioId } },
      order: { fecha_creacion: 'DESC' },
    });
  }

  // Eliminar egreso, asegurando que pertenezca al negocio
  async eliminar(id: number, negocioId: number) {
    const egreso = await this.repo.findOne({
      where: { id, negocio: { id: negocioId } },
    });
    if (!egreso) {
      throw new Error('Egreso no encontrado o no autorizado');
    }
    return this.repo.remove(egreso);
  }

  // Calcular total solo del negocio
  async calcularTotal(negocioId: number): Promise<number> {
    const egresos = await this.repo.find({
      where: { negocio: { id: negocioId } },
    });
    return egresos.reduce((acc, e) => acc + Number(e.valor), 0);
  }
}
