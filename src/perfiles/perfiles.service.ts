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
    @InjectRepository(Perfil) private perfilRepo: Repository<Perfil>,
    @InjectRepository(Cuenta) private cuentaRepo: Repository<Cuenta>,

    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,

    private readonly inventarioPerfilService: InventarioPerfilService,
  ) {}

  async create(dto: CreatePerfilDto, usuario: JwtPayload): Promise<Perfil> {
    const cuenta = await this.cuentaRepo.findOne({
      where: { id: dto.cuentaId },
      relations: ['perfiles', 'plataforma'], // 👈 asegúrate de traer también la plataforma
    });

    if (!cuenta) throw new NotFoundException('Cuenta no encontrada.');
    if (cuenta.negocioId !== usuario.negocioId) {
      throw new ForbiddenException('No tienes acceso a esta cuenta.');
    }

    const perfilesActivos = cuenta.perfiles.filter((p) => p.activo !== false);
    if (perfilesActivos.length >= cuenta.numero_perfiles) {
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
      correo_asignado: cuenta.correo,
      plataforma_asignada: cuenta.plataforma?.nombre,
    });

    await this.perfilRepo.save(nuevoPerfil);

    await this.inventarioPerfilService.registrarSalida(
      cuenta.plataformaId,
      cuenta.negocioId,
      1,
      `Perfil de "${cuenta.correo}" vendido a "${cliente.nombre}"`,
    );

    return nuevoPerfil;
  }
  async update(id: number, dto: UpdatePerfilDto): Promise<Perfil> {
    // 🔁 Refrescar el perfil desde la DB, siempre actualizado
    const perfil = await this.perfilRepo.findOne({
      where: { id },
      relations: ['cuenta', 'cuenta.plataforma'],
    });

    if (!perfil) {
      throw new NotFoundException('Perfil no encontrado.');
    }

    // 🔁 Refrescar también la cuenta directamente desde DB
    if (perfil.cuentaId) {
      const cuentaActualizada = await this.cuentaRepo.findOne({
        where: { id: perfil.cuentaId },
        relations: ['plataforma'],
      });
      if (cuentaActualizada) {
        perfil.cuenta = cuentaActualizada;
      }
    }

    const precio = dto.precio ?? perfil.precio;
    const tiempo = dto.tiempo_asignado ?? perfil.tiempo_asignado;
    const fechaVenta = dto.fecha_venta
      ? dayjs(dto.fecha_venta).toDate()
      : perfil.fecha_venta;

    const activo = dto.activo ?? perfil.activo;
    const dias = convertirTiempoADias(tiempo);
    const fechaCorte = dayjs(fechaVenta).add(dias, 'day').format('YYYY-MM-DD');
    const ganancia = precio - perfil.costo;

    const actualizado: Partial<Perfil> = {
      ...dto,
      precio,
      ganancia,
      fecha_venta: fechaVenta,
      activo,
    };

    if (activo === false) {
      if (perfil.fecha_baja === null) {
        actualizado.fecha_baja = dayjs().format('YYYY-MM-DD');
        actualizado.correo_asignado = perfil.cuenta?.correo;
        actualizado.plataforma_asignada = perfil.cuenta?.plataforma?.nombre;
      } else {
        actualizado.fecha_baja = perfil.fecha_baja;
        actualizado.correo_asignado = perfil.correo_asignado;
        actualizado.plataforma_asignada = perfil.plataforma_asignada;
      }
      actualizado.fecha_corte = null;
    } else {
      actualizado.fecha_baja = null;
      actualizado.fecha_corte = fechaCorte;
    }

    const final = this.perfilRepo.merge(perfil, actualizado);
    return this.perfilRepo.save(final);
  }

  async findByCuentaId(cuentaId: number): Promise<Perfil[]> {
    return this.perfilRepo.find({
      where: { cuentaId },
      relations: ['cliente', 'usuario'],
    });
  }

  // src/perfiles/perfiles.service.ts
  async remove(id: number): Promise<void> {
    const perfil = await this.perfilRepo.findOne({
      where: { id },
      relations: ['cuenta'],
    });

    if (!perfil) throw new NotFoundException('Perfil no encontrado.');

    if (!perfil.cuenta) {
      throw new BadRequestException(
        'Este perfil ya no está vinculado a una cuenta.',
      );
    }

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

    await this.perfilRepo.update(id, {
      activo: false,
      fecha_corte: null,
      fecha_baja: dayjs().format('YYYY-MM-DD'),
    });
  }
}
