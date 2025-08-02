//src/perfiles/perfiles.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
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
import { InventarioPerfilService } from 'src/inventario-perfil/inventario-perfil.service';

function convertirTiempoADias(tiempo: string): number {
  const normalizado = tiempo.normalize('NFD').replace(/[̀-ͯ]/g, '');
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
    return cantidad * 365;
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

    private readonly inventarioPerfilService: InventarioPerfilService,
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

    const inventario =
      await this.inventarioPerfilService.obtenerPorPlataformaYNegocio(
        cuenta.plataformaId,
        cuenta.negocioId,
      );

    if (!inventario || inventario.stock_perfiles <= 0) {
      throw new ConflictException(
        'No hay stock disponible para esta plataforma.',
      );
    }

    const costo = inventario.costo_promedio;
    const ganancia = dto.precio - costo;
    const dias = convertirTiempoADias(dto.tiempo_asignado);
    const fechaCorte = dayjs(dto.fecha_venta)
      .add(dias, 'day')
      .format('YYYY-MM-DD');

    const nuevoPerfil = this.perfilRepo.create({
      ...dto,
      costo,
      ganancia,
      fecha_corte: fechaCorte,
      usuarioId: usuario.id,
      cuenta,
    });

    await this.perfilRepo.save(nuevoPerfil);

    await this.inventarioPerfilService.registrarSalida(
      cuenta.plataformaId,
      cuenta.negocioId,
      1, // perfiles vendidos = 1
      `Perfil de "${cuenta.correo}" vendido a "${cliente.nombre}"`,
    );

    return nuevoPerfil;
  }

  async update(id: number, dto: UpdatePerfilDto): Promise<Perfil> {
    const perfil = await this.perfilRepo.findOne({ where: { id } });
    if (!perfil) {
      throw new NotFoundException('Perfil no encontrado.');
    }

    const precio = dto.precio ?? perfil.precio;
    const tiempo = dto.tiempo_asignado ?? perfil.tiempo_asignado;
    const fechaVenta = dto.fecha_venta ?? perfil.fecha_venta;
    const dias = convertirTiempoADias(tiempo);
    const fechaCorte = dayjs(fechaVenta).add(dias, 'day').format('YYYY-MM-DD');

    const ganancia = precio - perfil.costo;

    const actualizado = this.perfilRepo.merge(perfil, dto, {
      precio,
      ganancia,
      fecha_corte: fechaCorte,
    });

    return this.perfilRepo.save(actualizado);
  }

  async findByCuentaId(cuentaId: number): Promise<Perfil[]> {
    return this.perfilRepo.find({
      where: { cuentaId },
      relations: ['cliente', 'usuario'],
    });
  }

  async remove(id: number): Promise<void> {
    const perfil = await this.perfilRepo.findOne({
      where: { id },
      relations: ['cuenta'],
    });

    if (!perfil) throw new NotFoundException('Perfil no encontrado.');

    if (perfil.costo === null || isNaN(Number(perfil.costo))) {
      throw new BadRequestException('El perfil tiene un costo inválido.');
    }

    await this.inventarioPerfilService.registrarEntrada({
      plataformaId: perfil.cuenta.plataformaId,
      negocioId: perfil.cuenta.negocioId,
      perfiles: 1,
      costoTotal: Number(perfil.costo),
      descripcion: `Perfil de "${perfil.cuenta.correo}" desocupado`,
    });

    await this.perfilRepo.remove(perfil);
  }
}
