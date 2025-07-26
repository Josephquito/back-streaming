import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plataforma } from '../entities/plataforma.entity';
import { CreatePlataformaDto } from './dto/create-plataforma.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Negocio } from '../entities/negocio.entity';

@Injectable()
export class PlataformasService {
  constructor(
    @InjectRepository(Plataforma)
    private plataformaRepo: Repository<Plataforma>,

    @InjectRepository(Negocio)
    private negocioRepo: Repository<Negocio>,
  ) {}

  async create(data: CreatePlataformaDto, usuario: JwtPayload) {
    if (!usuario.negocioId) {
      throw new ForbiddenException('No tienes un negocio asignado');
    }

    const negocio = await this.negocioRepo.findOneBy({ id: usuario.negocioId });

    if (!negocio) {
      throw new NotFoundException('Negocio no encontrado');
    }

    const nueva = this.plataformaRepo.create({
      nombre: data.nombre,
      color: data.color,
      negocio,
    });

    return this.plataformaRepo.save(nueva);
  }

  findAll(usuario: JwtPayload) {
    if (!usuario.negocioId) {
      throw new ForbiddenException('No tienes un negocio asignado');
    }

    return this.plataformaRepo.find({
      where: { negocio: { id: usuario.negocioId } },
    });
  }

  async remove(id: number, usuario: JwtPayload) {
    if (!usuario.negocioId) {
      throw new ForbiddenException('No tienes un negocio asignado');
    }

    const plataforma = await this.plataformaRepo.findOne({
      where: {
        id,
        negocio: { id: usuario.negocioId },
      },
      relations: ['cuentas'],
    });

    if (!plataforma) {
      throw new NotFoundException('Plataforma no encontrada');
    }

    if (plataforma.cuentas.length > 0) {
      throw new ForbiddenException(
        'No se puede eliminar una plataforma con cuentas asociadas',
      );
    }

    await this.plataformaRepo.delete(id);
    return { eliminado: true };
  }
}
