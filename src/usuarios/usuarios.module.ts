import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../entities/usuario.entity';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Negocio } from 'src/entities/negocio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Negocio])],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}
