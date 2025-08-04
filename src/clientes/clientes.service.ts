// src/clientes/clientes.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Cliente } from '../entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { Perfil } from 'src/entities/perfil.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
  ) {}

  async create(dto: CreateClienteDto, usuario: JwtPayload): Promise<Cliente> {
    if (!usuario.negocioId) {
      throw new UnauthorizedException('No estás asociado a un negocio.');
    }

    const nuevo = this.clienteRepo.create({
      ...dto,
      negocios: [{ id: usuario.negocioId }],
    });

    return this.clienteRepo.save(nuevo);
  }

  async findByNegocio(usuario: JwtPayload): Promise<any[]> {
    if (!usuario.negocioId) {
      throw new UnauthorizedException('No estás asociado a un negocio.');
    }

    const clientes = await this.clienteRepo.find({
      where: {
        negocios: { id: usuario.negocioId },
      },
      relations: ['perfiles', 'negocios'],
    });

    const hoy = dayjs().format('YYYY-MM-DD');

    return clientes.map((cliente) => {
      const perfiles_activas = cliente.perfiles.filter(
        (p) => p.activo && dayjs(p.fecha_corte).isAfter(hoy),
      );

      return {
        ...cliente,
        perfiles_activas,
      };
    });
  }

  async findOne(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepo.findOne({
      where: { id },
      relations: ['negocios'],
    });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return cliente;
  }

  async update(id: number, dto: UpdateClienteDto): Promise<Cliente> {
    const cliente = await this.findOne(id);
    const actualizado = this.clienteRepo.merge(cliente, dto);
    return this.clienteRepo.save(actualizado);
  }

  async remove(id: number): Promise<void> {
    const cliente = await this.clienteRepo.findOne({
      where: { id },
      relations: ['perfiles'], // asegúrate de tener la relación definida
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (cliente.perfiles.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar un cliente con perfiles asociados o inactivos.',
      );
    }

    await this.clienteRepo.delete(id);
  }

  // Activos: solo perfiles activos
  async obtenerPerfilesActivos(clienteId: number): Promise<Perfil[]> {
    const hoy = dayjs().format('YYYY-MM-DD');
    return this.perfilRepo.find({
      where: {
        cliente: { id: clienteId },
        fecha_corte: MoreThan(hoy),
        activo: true,
      },
      relations: ['cuenta', 'cuenta.plataforma'],
    });
  }

  // Historial: incluye todos los perfiles que tuvo, incluso los eliminados
  async obtenerHistorialPerfiles(clienteId: number): Promise<Perfil[]> {
    const hoy = dayjs().format('YYYY-MM-DD');

    const perfiles = await this.perfilRepo.find({
      where: { cliente: { id: clienteId } },
      order: { fecha_venta: 'DESC' },
      relations: ['cuenta', 'cuenta.plataforma'],
    });

    return perfiles.filter(
      (p) => !p.activo || !dayjs(p.fecha_corte).isAfter(hoy),
    );
  }

  async obtenerHistorialCompleto(clienteId: number) {
    const cliente = await this.findOne(clienteId);

    const perfiles = await this.perfilRepo.find({
      where: { cliente: { id: clienteId } },
      relations: ['cuenta', 'cuenta.plataforma'],
      order: { fecha_venta: 'DESC' },
    });

    const hoy = dayjs().format('YYYY-MM-DD');

    const perfilesActivos = perfiles.filter(
      (p) => p.activo && dayjs(p.fecha_corte).isAfter(hoy),
    );

    const historialPerfiles = perfiles
      .filter((p) => !p.activo || !dayjs(p.fecha_corte).isAfter(hoy))
      .map((p) => {
        return {
          ...p,
          cuenta: null,
          // usa directamente lo que ya se guardó en la BD, sin fallback
          correo_asignado: p.correo_asignado,
          plataforma_asignada: p.plataforma_asignada,
        };
      });

    return {
      cliente,
      perfilesActivos,
      historialPerfiles,
    };
  }

  async obtenerResumenClientes(negocioId: number) {
    const query = this.perfilRepo
      .createQueryBuilder('perfil')
      .leftJoin('perfil.cliente', 'cliente')
      .leftJoin('cliente.negocios', 'negocio')
      .where('negocio.id = :negocioId', { negocioId })
      .select('cliente.id', 'clienteId')
      .addSelect('cliente.nombre', 'nombre')
      .addSelect('cliente.contacto', 'contacto')
      .addSelect('COUNT(perfil.id)', 'cantidad_perfiles')
      .addSelect('SUM(perfil.precio)', 'total_gastado')
      .addSelect('MAX(perfil.fecha_venta)', 'ultima_compra')
      .groupBy('cliente.id');

    return query.getRawMany();
  }

  async obtenerClientesNuncaCompraron(negocioId: number) {
    return this.clienteRepo
      .createQueryBuilder('cliente')
      .leftJoin('cliente.negocios', 'negocio')
      .leftJoin('cliente.perfiles', 'perfil')
      .where('negocio.id = :negocioId', { negocioId })
      .andWhere('perfil.id IS NULL')
      .getMany();
  }
}
