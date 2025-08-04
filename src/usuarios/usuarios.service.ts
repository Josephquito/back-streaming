import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { Negocio } from '../entities/negocio.entity'; // Asegúrate de importar la entidad
import { CrearAdminDto } from './dto/crear-admin.dto';
import { RolUsuario } from '../entities/usuario.entity'; // Asegúrate que exista y esté bien exportado
import * as bcrypt from 'bcrypt';
import { ActualizarAdminDto } from './dto/actualizar-admin.dto'; // Asegúrate de que este DTO exista

interface UsuarioActual {
  rol: 'superadmin' | 'admin' | 'empleado';
  negocioId?: number | null;
}

interface JwtPayload {
  rol: 'superadmin' | 'admin' | 'empleado' | 'cliente';
  negocioId?: number | null;
}

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private usuariosRepository: Repository<Usuario>,
    @InjectRepository(Negocio)
    private negocioRepository: Repository<Negocio>, // NUEVO
  ) {}

  async create(data: CrearAdminDto, usuarioActual: UsuarioActual) {
    const { rol, negocioId } = usuarioActual;

    if (!data.rol) {
      throw new BadRequestException(
        'Debe especificar el rol del nuevo usuario',
      );
    }

    const rolNuevo = data.rol as RolUsuario;

    // ✅ Hashear la clave antes de crear el usuario
    const claveHasheada = await bcrypt.hash(data.clave, 10);

    if (rol === 'superadmin') {
      if (rolNuevo !== RolUsuario.ADMIN) {
        throw new ForbiddenException('El superadmin solo puede crear admins');
      }

      if (
        !data.negocio ||
        !data.negocio.nombre ||
        !data.negocio.correo_contacto ||
        !data.negocio.telefono
      ) {
        throw new BadRequestException(
          'Debe proporcionar nombre, correo_contacto y telefono del negocio',
        );
      }

      const nuevoNegocio = this.negocioRepository.create({
        nombre: data.negocio.nombre,
        correo_contacto: data.negocio.correo_contacto,
        telefono: data.negocio.telefono,
      });
      const negocioGuardado = await this.negocioRepository.save(nuevoNegocio);

      const nuevoUsuario = this.usuariosRepository.create({
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        clave: claveHasheada, // 👈 clave encriptada
        telefono: data.telefono,
        rol: rolNuevo,
        negocio: { id: negocioGuardado.id },
      });
      const adminGuardado = await this.usuariosRepository.save(nuevoUsuario);

      negocioGuardado.admin = adminGuardado;
      await this.negocioRepository.save(negocioGuardado);

      return adminGuardado;
    } else if (rol === 'admin') {
      if ([RolUsuario.ADMIN, RolUsuario.SUPERADMIN].includes(rolNuevo)) {
        throw new ForbiddenException('El admin no puede crear otros admins');
      }

      if (!negocioId) {
        throw new ForbiddenException('No tiene negocio asignado');
      }

      const nuevoEmpleado = this.usuariosRepository.create({
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        clave: claveHasheada, // 👈 clave encriptada
        telefono: data.telefono,
        rol: rolNuevo,
        negocio: { id: negocioId },
      });

      return this.usuariosRepository.save(nuevoEmpleado);
    }

    throw new ForbiddenException('No tiene permisos para crear usuarios');
  }

  findTodos() {
    return this.usuariosRepository.find({
      relations: ['negocio'],
    });
  }

  findTodosPorNegocio(negocioId: number) {
    return this.usuariosRepository.find({
      where: { negocio: { id: negocioId } },
      relations: ['negocio'],
    });
  }

  findAllByNegocio(negocioId: number) {
    return this.usuariosRepository.find({
      where: { activo: true, negocio: { id: negocioId } },
      relations: ['negocio'],
    });
  }

  async findAdmins() {
    return this.usuariosRepository.find({
      where: { rol: RolUsuario.ADMIN, activo: true },
      relations: ['negocio'],
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        telefono: true,
        rol: true,
        negocio: {
          id: true,
          nombre: true,
        },
      },
    });
  }

  findOne(id: number) {
    return this.usuariosRepository.findOneBy({ id });
  }

  async findOneConRestriccion(id: number, user: JwtPayload) {
    const encontrado = await this.usuariosRepository.findOne({
      where: { id },
      relations: ['negocio'],
    });

    if (!encontrado) return null;

    if (user.rol === 'superadmin') return encontrado;

    if (encontrado.negocio?.id !== user.negocioId) {
      throw new ForbiddenException('No puede acceder a este usuario');
    }

    return encontrado;
  }

  update(id: number, data: Partial<Usuario>) {
    return this.usuariosRepository.update(id, data);
  }

  async remove(id: number) {
    await this.usuariosRepository.update(id, { activo: false });
    return { eliminado: true };
  }

  async updateConRestriccion(
    id: number,
    data: Partial<Usuario> | ActualizarAdminDto,
    user: JwtPayload,
  ) {
    await this.findOneConRestriccion(id, user);

    const cambios: Partial<Usuario> = {
      ...(data as any),
    };

    return this.usuariosRepository.update(id, cambios);
  }

  async removeConRestriccion(id: number, user: JwtPayload) {
    const admin = await this.findOneConRestriccion(id, user);

    if (!admin) {
      throw new BadRequestException('No se encontró el usuario');
    }

    // Solo el superadmin puede eliminar un admin y su negocio
    if (user.rol !== 'superadmin') {
      throw new ForbiddenException(
        'Solo el superadmin puede eliminar un admin con su negocio',
      );
    }

    // Buscar el negocio donde este admin es dueño
    const negocio = await this.negocioRepository.findOne({
      where: { admin: { id: admin.id } },
      relations: ['usuarios'],
    });

    if (!negocio) {
      throw new BadRequestException('Este admin no tiene un negocio asignado');
    }

    // 1. Eliminar empleados (excepto el admin mismo)
    const empleados = negocio.usuarios.filter((u) => u.id !== admin.id);
    for (const empleado of empleados) {
      await this.usuariosRepository.delete(empleado.id);
    }

    // 2. Eliminar el admin
    await this.usuariosRepository.delete(admin.id);

    // 3. Eliminar el negocio
    await this.negocioRepository.delete(negocio.id);

    return { eliminado: true };
  }

  async actualizarAdminConNegocio(id: number, body: ActualizarAdminDto) {
    const usuario = await this.usuariosRepository.findOne({
      where: { id },
      relations: ['negocio'],
    });

    if (!usuario) {
      throw new BadRequestException('Administrador no encontrado');
    }

    // ✅ Ahora TypeScript sabe que body.telefono es string | undefined
    if (body.telefono) {
      usuario.telefono = body.telefono;
    }

    if (usuario.negocio && body.negocio) {
      usuario.negocio.nombre = body.negocio.nombre || usuario.negocio.nombre;
      usuario.negocio.telefono =
        body.negocio.telefono || usuario.negocio.telefono;
      usuario.negocio.correo_contacto =
        body.negocio.correo_contacto || usuario.negocio.correo_contacto;

      await this.negocioRepository.save(usuario.negocio);
    }

    await this.usuariosRepository.save(usuario);

    return { mensaje: 'Administrador y negocio actualizados correctamente' };
  }
}
