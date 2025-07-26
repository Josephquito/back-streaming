import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perdida } from './entities/perdida.entity';
import { CrearPerdidaDto } from './dto/crear-perdida.dto';

@Injectable()
export class PerdidasService {
  constructor(
    @InjectRepository(Perdida)
    private readonly repo: Repository<Perdida>,
  ) {}

  crear(dto: CrearPerdidaDto) {
    const perdida = this.repo.create(dto);
    return this.repo.save(perdida);
  }

  findAll() {
    return this.repo.find();
  }

  eliminar(id: number) {
    return this.repo.delete(id);
  }

  async calcularTotal(): Promise<number> {
    const perdidas = await this.repo.find();
    return perdidas.reduce((acc, item) => acc + Number(item.valor), 0);
  }
}
