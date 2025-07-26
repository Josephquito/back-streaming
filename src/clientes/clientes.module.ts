// src/clientes/clientes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from '../entities/cliente.entity';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
import { Negocio } from 'src/entities/negocio.entity';
import { Perfil } from 'src/entities/perfil.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, Negocio, Perfil])],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
