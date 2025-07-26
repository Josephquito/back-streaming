import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../entities/usuario.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,

    private readonly jwtService: JwtService,
  ) {}

  async validarCredenciales(loginDto: LoginDto) {
    const { correo, clave } = loginDto;

    const usuario = await this.usuarioRepo.findOne({
      where: { correo, activo: true },
      relations: ['negocio'], // 👈 necesario para obtener negocioId
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const claveValida = await bcrypt.compare(clave, usuario.clave);
    if (!claveValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: usuario.id,
      rol: usuario.rol,
      negocioId: usuario.negocio?.id ?? null,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    };
  }

  async register(data: RegisterDto) {
    const { clave, correo } = data;

    const existe = await this.usuarioRepo.findOne({ where: { correo } });
    if (existe) {
      throw new Error('El correo ya está registrado');
    }

    const claveHasheada = await bcrypt.hash(clave, 10);

    const nuevoUsuario = this.usuarioRepo.create({
      ...data,
      clave: claveHasheada,
      activo: true,
    });

    return this.usuarioRepo.save(nuevoUsuario);
  }
}
