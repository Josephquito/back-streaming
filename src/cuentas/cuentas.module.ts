import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentasService } from './cuentas.service';
import { CuentasController } from './cuentas.controller';
import { Cuenta } from '../entities/cuenta.entity';
import { Usuario } from '../entities/usuario.entity'; // 👈 importante
import { Perfil } from 'src/entities/perfil.entity';
import { InventarioPerfilModule } from 'src/inventario-perfil/inventario-perfil.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cuenta, Usuario, Perfil]),
    InventarioPerfilModule, // 👈 aquí deben ir tus entidades
  ],
  exports: [TypeOrmModule],
  controllers: [CuentasController],
  providers: [CuentasService],
})
export class CuentasModule {}
