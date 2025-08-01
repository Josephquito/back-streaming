import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioPerfil } from 'src/entities/inventario-perfil.entity';
import { InventarioPerfilService } from './inventario-perfil.service';
import { InventarioPerfilController } from './inventario-perfil.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InventarioPerfil])],
  controllers: [InventarioPerfilController],
  providers: [InventarioPerfilService],
  exports: [InventarioPerfilService],
})
export class InventarioPerfilModule {}
