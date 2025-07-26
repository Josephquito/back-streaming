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
import { EgresoFijo } from './finanzas/egresos-fijos/entities/egreso-fijo.entity';
import { CompraInversion } from './finanzas/compras-inversiones/entities/compra-inversion.entity';
import { Perdida } from './finanzas/perdidas/entities/perdida.entity';
import { FinanzasModule } from './finanzas/finanzas.module';

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
        EgresoFijo,
        CompraInversion,
        Perdida,
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
    FinanzasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
