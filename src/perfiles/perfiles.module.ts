import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilesService } from './perfiles.service';
import { PerfilesController } from './perfiles.controller';
import { Perfil } from '../entities/perfil.entity';
import { Cuenta } from 'src/entities/cuenta.entity';
import { Cliente } from 'src/entities/cliente.entity';
import { InventarioPerfilModule } from 'src/inventario-perfil/inventario-perfil.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Perfil, Cuenta, Cliente]),
    InventarioPerfilModule,
  ],
  controllers: [PerfilesController],
  providers: [PerfilesService],
})
export class PerfilesModule {}
