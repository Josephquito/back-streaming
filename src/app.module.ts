import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Usuario } from './entities/usuario.entity';
import { Negocio } from './entities/negocio.entity';
import { SuscripcionNegocio } from './entities/suscripcion-negocio.entity';
import { Plataforma } from './entities/plataforma.entity';
import { Cuenta } from './entities/cuenta.entity';
import { Perfil } from './entities/perfil.entity';
import { Cliente } from './entities/cliente.entity';
import { BitacoraAccion } from './entities/bitacora-accion.entity';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PlataformasModule } from './plataformas/plataformas.module';
import { CuentasModule } from './cuentas/cuentas.module';
import { PerfilesModule } from './perfiles/perfiles.module';
import { ClientesModule } from './clientes/clientes.module';
import { InventarioPerfilModule } from './inventario-perfil/inventario-perfil.module';
import { InventarioPerfil } from './entities/inventario-perfil.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 🔥 Carga el .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: +(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [
        Usuario,
        Negocio,
        SuscripcionNegocio,
        Plataforma,
        Cuenta,
        Perfil,
        Cliente,
        BitacoraAccion,
        InventarioPerfil,
      ],
      synchronize: true,
    }),
    AuthModule,
    UsuariosModule,
    UsuariosModule,
    PlataformasModule,
    CuentasModule,
    PerfilesModule,
    ClientesModule,
    InventarioPerfilModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
