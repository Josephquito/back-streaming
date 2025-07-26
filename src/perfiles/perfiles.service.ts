//src/perfiles/perfiles.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from '../entities/perfil.entity';
import { CreatePerfilDto } from './dto/create-perfil.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { Cuenta } from 'src/entities/cuenta.entity';
import { Cliente } from 'src/entities/cliente.entity';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import * as dayjs from 'dayjs';
import { RolUsuario } from 'src/entities/usuario.entity';

function convertirTiempoADias(tiempo: string): number {
  const normalizado = tiempo.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // elimina tildes

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
export class PerfilesService {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,

    @InjectRepository(Cuenta)
    private readonly cuentaRepo: Repository<Cuenta>,

    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
  ) {}

  async create(dto: CreatePerfilDto, usuario: JwtPayload): Promise<Perfil> {
    const cuenta = await this.cuentaRepo.findOne({
      where: { id: dto.cuentaId },
      relations: ['perfiles'],
    });

    if (!cuenta) throw new NotFoundException('Cuenta no encontrada.');

    if (cuenta.negocioId !== usuario.negocioId) {
      throw new ForbiddenException('No tienes acceso a esta cuenta.');
    }

    if (cuenta.perfiles.length >= cuenta.numero_perfiles) {
      throw new ForbiddenException(
        `Esta cuenta ya alcanzó el máximo de perfiles permitidos (${cuenta.numero_perfiles}).`,
      );
    }

    const cliente = await this.clienteRepo.findOne({
      where: { id: dto.clienteId },
    });

    if (!cliente) throw new NotFoundException('Cliente no encontrado.');

    // calcular costo, ganancia y distribución inicial
    const cantidadFinal = cuenta.perfiles.length + 1;
    const costo = cuenta.costo_total / cantidadFinal;
    const ganancia = dto.precio - costo;
    const dias = convertirTiempoADias(dto.tiempo_asignado);
    const fechaCorte = dayjs(dto.fecha_venta)
      .add(dias, 'day')
      .format('YYYY-MM-DD');

    // DISTRIBUCIÓN DE GANANCIA
    let para_empleado = 0;
    let para_admin = 0;
    let para_negocio = 0;

    if (usuario.rol === 'admin') {
      para_admin = ganancia * 0.7;
      para_negocio = ganancia * 0.3;
    } else if (usuario.rol === 'empleado') {
      para_empleado = ganancia * 0.3;
      para_admin = ganancia * 0.4;
      para_negocio = ganancia * 0.3;
    }

    const nuevoPerfil = this.perfilRepo.create({
      ...dto,
      costo,
      ganancia,
      para_empleado,
      para_admin,
      para_negocio,
      fecha_corte: fechaCorte,
      usuarioId: usuario.id,
    });

    await this.perfilRepo.save(nuevoPerfil);

    // Recalcular todos los perfiles con nuevo costo y redistribuir
    const perfiles = await this.perfilRepo.find({
      where: { cuenta: { id: cuenta.id } },
    });

    const nuevoCosto = cuenta.costo_total / perfiles.length;

    for (const p of perfiles) {
      const dias = convertirTiempoADias(p.tiempo_asignado);
      p.costo = nuevoCosto;
      p.ganancia = p.precio - nuevoCosto;
      p.fecha_corte = dayjs(p.fecha_venta)
        .add(dias, 'day')
        .format('YYYY-MM-DD');

      // Redistibuir ganancia de cada perfil según su usuario
      if (p.usuario?.rol === RolUsuario.ADMIN) {
        p.para_admin = p.ganancia * 0.7;
        p.para_empleado = 0;
        p.para_negocio = p.ganancia * 0.3;
      } else {
        p.para_empleado = p.ganancia * 0.3;
        p.para_admin = p.ganancia * 0.4;
        p.para_negocio = p.ganancia * 0.3;
      }

      await this.perfilRepo.save(p);
    }

    return nuevoPerfil;
  }

  async findAll(): Promise<Perfil[]> {
    return this.perfilRepo.find();
  }

  async findOne(id: number): Promise<Perfil> {
    const perfil = await this.perfilRepo.findOne({ where: { id } });
    if (!perfil) throw new NotFoundException('Perfil no encontrado.');
    return perfil;
  }

  async update(id: number, dto: UpdatePerfilDto): Promise<Perfil> {
    const perfil = await this.perfilRepo.findOne({
      where: { id },
      relations: ['cuenta', 'usuario'], // 👈 IMPORTANTE: ahora también traes el usuario
    });

    if (!perfil) {
      throw new NotFoundException('Perfil no encontrado.');
    }

    const precio = dto.precio ?? perfil.precio;
    const tiempo = dto.tiempo_asignado ?? perfil.tiempo_asignado;
    const fechaVenta = dto.fecha_venta ?? perfil.fecha_venta;

    // 🔢 contar perfiles existentes en esa cuenta
    const perfilesUsados = await this.perfilRepo.count({
      where: { cuentaId: perfil.cuentaId },
    });

    if (perfilesUsados === 0) {
      throw new ConflictException(
        'La cuenta no tiene perfiles para calcular costo.',
      );
    }

    const costo = perfil.cuenta.costo_total / perfilesUsados;
    const ganancia = precio - costo;

    const dias = convertirTiempoADias(tiempo);
    const fechaCorte = dayjs(fechaVenta).add(dias, 'day').format('YYYY-MM-DD');

    // 🧠 distribuir ganancia según rol
    let para_empleado = 0;
    let para_admin = 0;
    let para_negocio = 0;

    if (perfil.usuario.rol === RolUsuario.ADMIN) {
      para_admin = ganancia * 0.7;
      para_negocio = ganancia * 0.3;
    } else {
      para_empleado = ganancia * 0.3;
      para_admin = ganancia * 0.4;
      para_negocio = ganancia * 0.3;
    }

    const actualizado = this.perfilRepo.merge(perfil, dto, {
      precio,
      costo,
      ganancia,
      fecha_corte: fechaCorte,
      para_empleado,
      para_admin,
      para_negocio,
    });

    return this.perfilRepo.save(actualizado);
  }

  async remove(id: number): Promise<void> {
    const perfil = await this.perfilRepo.findOne({
      where: { id },
      relations: ['cuenta'],
    });

    if (!perfil) throw new NotFoundException('Perfil no encontrado.');

    const cuenta = perfil.cuenta;

    // Eliminar el perfil
    await this.perfilRepo.remove(perfil);

    // Recalcular perfiles restantes con usuario incluido
    const restantes = await this.perfilRepo.find({
      where: { cuenta: { id: cuenta.id } },
      relations: ['usuario'], // 👈 NECESARIO para acceder a rol
    });

    if (restantes.length === 0) return;

    const nuevoCosto = cuenta.costo_total / restantes.length;

    for (const p of restantes) {
      const dias = convertirTiempoADias(p.tiempo_asignado);
      p.costo = nuevoCosto;
      p.ganancia = p.precio - nuevoCosto;
      p.fecha_corte = dayjs(p.fecha_venta)
        .add(dias, 'day')
        .format('YYYY-MM-DD');

      // 🔁 Recalcular distribución
      if (p.usuario?.rol === RolUsuario.ADMIN) {
        p.para_admin = p.ganancia * 0.7;
        p.para_empleado = 0;
        p.para_negocio = p.ganancia * 0.3;
      } else {
        p.para_empleado = p.ganancia * 0.3;
        p.para_admin = p.ganancia * 0.4;
        p.para_negocio = p.ganancia * 0.3;
      }

      await this.perfilRepo.save(p);
    }
  }

  async findByCuentaId(cuentaId: number): Promise<Perfil[]> {
    return this.perfilRepo.find({
      where: { cuentaId },
      relations: ['cliente', 'usuario'], // lo que necesitas mostrar en frontend
    });
  }
}
