// src/clientes/clientes.service.ts
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
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

  async findByNegocio(usuario: JwtPayload): Promise<Cliente[]> {
    if (!usuario.negocioId) {
      throw new UnauthorizedException('No estás asociado a un negocio.');
    }

    return this.clienteRepo
      .createQueryBuilder('cliente')
      .leftJoin('cliente.negocios', 'negocio')
      .where('negocio.id = :negocioId', { negocioId: usuario.negocioId })
      .getMany();
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
    const result = await this.clienteRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Cliente no encontrado');
    }
  }

  async obtenerPerfilesActivos(clienteId: number): Promise<Perfil[]> {
    const hoy = dayjs().format('YYYY-MM-DD');
    return this.perfilRepo.find({
      where: {
        cliente: { id: clienteId },
        fecha_corte: MoreThan(hoy),
      },
      relations: ['cuenta', 'cuenta.plataforma'],
    });
  }

  async obtenerHistorialPerfiles(clienteId: number): Promise<Perfil[]> {
    return this.perfilRepo.find({
      where: { cliente: { id: clienteId } },
      order: { fecha_venta: 'DESC' },
      relations: ['cuenta', 'cuenta.plataforma'],
    });
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
