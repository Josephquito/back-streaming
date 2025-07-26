//src/cuentas/cuentas.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuenta } from '../entities/cuenta.entity';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { Perfil } from 'src/entities/perfil.entity';
import * as dayjs from 'dayjs';

function convertirTiempoADias(tiempo: string): number {
  const normalizado = tiempo.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (normalizado.includes('dia')) {
    const match = normalizado.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  if (normalizado.includes('mes')) {
    const match = normalizado.match(/\d+/);
    const cantidad = match ? parseInt(match[0]) : 1;
    return cantidad * 30;
  }

  if (normalizado.includes('ano')) {
    const match = normalizado.match(/\d+/);
    const cantidad = match ? parseInt(match[0]) : 1;
    return cantidad * 365; // o 360 si prefieres base contable
  }

  return 0;
}

@Injectable()
export class CuentasService {
  constructor(
    @InjectRepository(Cuenta)
    private readonly cuentaRepo: Repository<Cuenta>,

    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
  ) {}

  async create(dto: CreateCuentaDto, usuario: JwtPayload): Promise<Cuenta> {
    const negocioId = usuario.negocioId;

    if (!negocioId) {
      throw new UnauthorizedException(
        'Tu cuenta no está asociada a un negocio.',
      );
    }

    const existe = await this.cuentaRepo.findOne({
      where: {
        correo: dto.correo,
        plataformaId: dto.plataformaId,
        negocioId,
      },
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe una cuenta con el correo ${dto.correo} en esta plataforma para tu negocio.`,
      );
    }

    const dias = convertirTiempoADias(dto.tiempo_asignado);
    const fechaCorte = dayjs(dto.fecha_compra)
      .add(dias, 'day')
      .format('YYYY-MM-DD');

    const cuenta = this.cuentaRepo.create({
      ...dto,
      negocioId,
      fecha_corte: fechaCorte,
    });

    return this.cuentaRepo.save(cuenta);
  }

  async findByNegocioUsuario(usuario: JwtPayload): Promise<any[]> {
    const negocioId = usuario.negocioId;

    if (!negocioId) {
      throw new UnauthorizedException(
        'Tu cuenta no está asociada a un negocio.',
      );
    }

    const cuentas = await this.cuentaRepo.find({
      where: { negocioId },
      relations: ['perfiles', 'plataforma'],
    });

    return cuentas.map((cuenta) => ({
      ...cuenta,
      perfiles_usados: cuenta.perfiles.length,
    }));
  }

  async findAll(): Promise<any[]> {
    const cuentas = await this.cuentaRepo.find({
      relations: ['perfiles', 'plataforma'],
    });

    return cuentas.map((cuenta) => ({
      ...cuenta,
      perfiles_usados: cuenta.perfiles.length,
    }));
  }

  async findByNegocio(negocioId: number): Promise<Cuenta[]> {
    return this.cuentaRepo.find({
      where: { negocioId },
    });
  }

  async update(id: number, dto: UpdateCuentaDto): Promise<Cuenta> {
    const cuenta = await this.cuentaRepo.findOne({
      where: { id },
      relations: ['perfiles'],
    });

    if (!cuenta) {
      throw new NotFoundException('Cuenta no encontrada.');
    }

    const actualizada = this.cuentaRepo.merge(cuenta, dto);

    const tiempo = dto.tiempo_asignado ?? cuenta.tiempo_asignado;
    const fechaCompra = dto.fecha_compra ?? cuenta.fecha_compra;

    const dias = convertirTiempoADias(tiempo);
    actualizada.fecha_corte = dayjs(fechaCompra)
      .add(dias, 'day')
      .format('YYYY-MM-DD');

    const cuentaGuardada = await this.cuentaRepo.save(actualizada);

    // ✅ Recalcular costo y ganancia de perfiles si cambió costo_total o numero_perfiles
    if (dto.costo_total !== undefined || dto.numero_perfiles !== undefined) {
      const nuevoCosto =
        cuentaGuardada.costo_total / cuentaGuardada.numero_perfiles;

      for (const perfil of cuenta.perfiles) {
        perfil.costo = nuevoCosto;
        perfil.ganancia = perfil.precio - nuevoCosto;
        await this.perfilRepo.save(perfil);
      }
    }

    return cuentaGuardada;
  }

  async remove(id: number): Promise<void> {
    const result = await this.cuentaRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Cuenta no encontrada.');
    }
  }

  async obtenerCuentasDisponibles(usuario: JwtPayload): Promise<any[]> {
    if (!usuario.negocioId) {
      throw new UnauthorizedException('No tienes un negocio asignado.');
    }

    const cuentas = await this.cuentaRepo.find({
      where: { negocioId: usuario.negocioId },
      relations: ['perfiles', 'plataforma'],
    });

    return cuentas
      .filter((cuenta) => cuenta.perfiles.length < cuenta.numero_perfiles)
      .map((cuenta) => ({
        id: cuenta.id,
        correo: cuenta.correo,
        plataforma: cuenta.plataforma.nombre,
        total_perfiles: cuenta.numero_perfiles,
        usados: cuenta.perfiles.length,
        disponibles: cuenta.numero_perfiles - cuenta.perfiles.length,
      }));
  }

  async findOneByNegocio(id: number, usuario: JwtPayload): Promise<Cuenta> {
    if (!usuario.negocioId) {
      throw new UnauthorizedException('Tu cuenta no tiene un negocio asignado');
    }

    const cuenta = await this.cuentaRepo.findOne({
      where: {
        id,
        negocioId: usuario.negocioId,
      },
      relations: ['plataforma', 'perfiles'],
    });

    if (!cuenta) {
      throw new NotFoundException('Cuenta no encontrada en tu negocio');
    }

    return cuenta;
  }
}
