//src/cuentas/cuentas.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuenta } from '../entities/cuenta.entity';
import { CreateCuentaDto } from './dto/create-cuenta.dto';
import { UpdateCuentaDto } from './dto/update-cuenta.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { Perfil } from 'src/entities/perfil.entity';
import * as dayjs from 'dayjs';
import { InventarioPerfilService } from 'src/inventario-perfil/inventario-perfil.service';
import { ReemplazoCuentaDto } from './dto/reemplazo-cuenta.dto';
import { v4 as uuidv4 } from 'uuid';

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
export class CuentasService {
  constructor(
    @InjectRepository(Cuenta)
    private readonly cuentaRepo: Repository<Cuenta>,

    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,

    private readonly inventarioPerfilService: InventarioPerfilService,
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

    const cuentaGuardada = await this.cuentaRepo.save(cuenta);

    await this.inventarioPerfilService.registrarEntrada({
      plataformaId: cuentaGuardada.plataformaId,
      negocioId: cuentaGuardada.negocioId,
      perfiles: cuentaGuardada.numero_perfiles,
      costoTotal: cuentaGuardada.costo_total,
    });

    return cuentaGuardada;
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

  async update(id: number, dto: UpdateCuentaDto): Promise<Cuenta> {
    const cuenta = await this.cuentaRepo.findOne({
      where: { id },
      relations: ['perfiles'],
    });

    if (!cuenta) {
      throw new NotFoundException('Cuenta no encontrada.');
    }

    const estabaInhabilitada = cuenta.inhabilitada;
    const seraInhabilitada = dto.inhabilitada ?? cuenta.inhabilitada;

    const actualizada = this.cuentaRepo.merge(cuenta, dto);

    const tiempo = dto.tiempo_asignado ?? cuenta.tiempo_asignado;
    const fechaCompra = dto.fecha_compra ?? cuenta.fecha_compra;

    const dias = convertirTiempoADias(tiempo);
    actualizada.fecha_corte = dayjs(fechaCompra)
      .add(dias, 'day')
      .format('YYYY-MM-DD');

    const cuentaGuardada = await this.cuentaRepo.save(actualizada);

    // ✅ Recalcular costos si cambió costo o perfiles
    if (dto.costo_total !== undefined || dto.numero_perfiles !== undefined) {
      const nuevoCosto =
        cuentaGuardada.costo_total / cuentaGuardada.numero_perfiles;

      for (const perfil of cuenta.perfiles) {
        perfil.costo = nuevoCosto;
        perfil.ganancia = perfil.precio - nuevoCosto;
        await this.perfilRepo.save(perfil);
      }
    }

    const perfilesVendidos = cuenta.perfiles.length;
    const perfilesDisponibles = cuenta.numero_perfiles - perfilesVendidos;

    // 🔁 Se habilita la cuenta → agregar al inventario los perfiles disponibles
    if (
      estabaInhabilitada &&
      seraInhabilitada === false &&
      perfilesDisponibles > 0
    ) {
      await this.inventarioPerfilService.registrarEntrada({
        plataformaId: cuenta.plataformaId,
        negocioId: cuenta.negocioId,
        perfiles: perfilesDisponibles,
        costoTotal:
          cuenta.costo_total * (perfilesDisponibles / cuenta.numero_perfiles),
      });
    }

    // 🔁 Se inhabilita la cuenta → retirar del inventario los perfiles disponibles
    if (
      !estabaInhabilitada &&
      seraInhabilitada === true &&
      perfilesDisponibles > 0
    ) {
      await this.inventarioPerfilService.registrarSalida(
        cuenta.plataformaId,
        cuenta.negocioId,
        perfilesDisponibles,
      );
    }

    return cuentaGuardada;
  }

  async remove(id: number, usuario: JwtPayload): Promise<void> {
    const cuenta = await this.cuentaRepo.findOne({
      where: { id },
      relations: ['perfiles'],
    });

    if (!cuenta) throw new NotFoundException('Cuenta no encontrada.');

    if (cuenta.negocioId !== usuario.negocioId) {
      throw new ForbiddenException('No tienes acceso a esta cuenta.');
    }

    const perfilesVendidos = cuenta.perfiles.length;
    const perfilesTotales = cuenta.numero_perfiles;
    const perfilesDisponibles = perfilesTotales - perfilesVendidos;

    // ✅ Solo descontar del inventario si la cuenta aún está habilitada
    if (!cuenta.inhabilitada && perfilesDisponibles > 0) {
      await this.inventarioPerfilService.registrarSalida(
        cuenta.plataformaId,
        cuenta.negocioId,
        perfilesDisponibles,
      );
    }

    // 🔥 Eliminar la cuenta (y sus perfiles por cascade)
    await this.cuentaRepo.remove(cuenta);
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

  async reemplazarCuenta(
    id: number,
    dto: ReemplazoCuentaDto,
    usuario: JwtPayload,
  ): Promise<Cuenta> {
    if (!usuario.negocioId) {
      throw new UnauthorizedException(
        'Tu cuenta no está asociada a un negocio',
      );
    }

    const negocioId = usuario.negocioId;

    const cuenta = await this.cuentaRepo.findOne({
      where: { id, negocioId },
      relations: ['perfiles'],
    });

    if (!cuenta) {
      throw new NotFoundException('Cuenta original no encontrada.');
    }

    // 🔁 CASO 1: solo cambia correo y clave (proveedor)
    if (dto.tipo === 'PROVEEDOR') {
      cuenta.correo = dto.nuevoCorreo;
      cuenta.clave = dto.nuevaClave;
      return await this.cuentaRepo.save(cuenta);
    }

    // 🔁 CASO 2: reemplazo como si fuese compra nueva
    if (dto.tipo === 'COMPRA_NUEVA') {
      cuenta.inhabilitada = true;
      await this.cuentaRepo.save(cuenta);

      await this.inventarioPerfilService.registrarSalida(
        cuenta.plataformaId,
        negocioId,
        cuenta.numero_perfiles,
      );

      const dias = convertirTiempoADias(dto.tiempo_establecido);
      const nuevaFechaCorte = dayjs(dto.fecha_compra)
        .add(dias, 'day')
        .format('YYYY-MM-DD');

      cuenta.correo = dto.nuevoCorreo;
      cuenta.clave = dto.nuevaClave;
      cuenta.proveedor = dto.proveedor;
      cuenta.fecha_compra = dto.fecha_compra;
      cuenta.costo_total = dto.costo;
      cuenta.tiempo_asignado = dto.tiempo_establecido;
      cuenta.fecha_corte = nuevaFechaCorte;
      cuenta.inhabilitada = false;

      const actualizada = await this.cuentaRepo.save(cuenta);

      await this.inventarioPerfilService.registrarEntrada({
        negocioId,
        plataformaId: cuenta.plataformaId,
        perfiles: cuenta.numero_perfiles,
        costoTotal: cuenta.costo_total,
      });

      return actualizada;
    }

    // 🔁 CASO 3: reemplazo con cuenta existente del inventario
    if (dto.tipo === 'COMPRA_EXISTENTE') {
      const nueva = await this.cuentaRepo.findOne({
        where: {
          id: dto.cuentaExistenteId,
          negocioId,
          inhabilitada: false,
        },
        relations: ['perfiles'],
      });

      if (!nueva) throw new NotFoundException('Cuenta existente no válida.');
      if (nueva.perfiles.length > 0) {
        throw new ConflictException(
          'La cuenta existente ya tiene perfiles asignados.',
        );
      }
      if (dayjs(nueva.fecha_corte).isBefore(dayjs())) {
        throw new ConflictException('La cuenta existente ya está vencida.');
      }

      // 📦 Copiar datos originales de la cuenta caída
      const datosOriginales = {
        correo: cuenta.correo,
        clave: cuenta.clave,
        proveedor: cuenta.proveedor,
        fecha_compra: cuenta.fecha_compra,
        fecha_corte: cuenta.fecha_corte,
        tiempo_asignado: cuenta.tiempo_asignado,
        costo_total: cuenta.costo_total,
        numero_perfiles: cuenta.numero_perfiles,
      };

      const perfilesOriginales = cuenta.numero_perfiles;
      const correoRealDonadora = nueva.correo;

      // 🧪 Renombrar correo de la donadora para liberar el real
      nueva.correo = `tmp-${uuidv4()}@temporal.com`;
      await this.cuentaRepo.save(nueva);

      // 📉 Salida de inventario solo por la cuenta caída
      await this.inventarioPerfilService.registrarSalida(
        cuenta.plataformaId,
        negocioId,
        perfilesOriginales,
      );

      // 🔁 Transferir datos de la donadora a la cuenta original
      cuenta.correo = correoRealDonadora;
      cuenta.clave = nueva.clave;
      cuenta.proveedor = nueva.proveedor;
      cuenta.fecha_compra = nueva.fecha_compra;
      cuenta.fecha_corte = nueva.fecha_corte;
      cuenta.tiempo_asignado = nueva.tiempo_asignado;
      cuenta.costo_total = nueva.costo_total;
      cuenta.numero_perfiles = nueva.numero_perfiles;
      cuenta.inhabilitada = false;

      const actualizada = await this.cuentaRepo.save(cuenta);

      // ❌ No registrar entrada: los perfiles de la cuenta donadora ya estaban en el inventario

      // 🔁 Guardar datos de la cuenta original en la donadora (que ahora queda inhabilitada)
      nueva.correo = datosOriginales.correo;
      nueva.clave = datosOriginales.clave;
      nueva.proveedor = datosOriginales.proveedor;
      nueva.fecha_compra = datosOriginales.fecha_compra;
      nueva.fecha_corte = datosOriginales.fecha_corte;
      nueva.tiempo_asignado = datosOriginales.tiempo_asignado;
      nueva.costo_total = datosOriginales.costo_total;
      nueva.numero_perfiles = datosOriginales.numero_perfiles;
      nueva.inhabilitada = true;

      await this.cuentaRepo.save(nueva);

      return actualizada;
    }

    throw new ConflictException('Tipo de reemplazo no válido.');
  }

  async buscarCuentasDisponiblesParaReemplazo(
    negocioId: number,
    plataformaId: number,
  ) {
    return this.cuentaRepo
      .createQueryBuilder('cuenta')
      .leftJoin('cuenta.perfiles', 'perfil')
      .where('cuenta.negocioId = :negocioId', { negocioId })
      .andWhere('cuenta.plataformaId = :plataformaId', { plataformaId })
      .andWhere('cuenta.inhabilitada = false')
      .andWhere('perfil.id IS NULL') // sin perfiles
      .andWhere('cuenta.fecha_corte > :hoy', {
        hoy: dayjs().format('YYYY-MM-DD'),
      })
      .getMany();
  }
}
