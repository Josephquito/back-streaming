// src/plataformas/plataformas.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plataforma } from '../entities/plataforma.entity';
import { PlataformasService } from './plataformas.service';
import { PlataformasController } from './plataformas.controller';
import { Negocio } from '../entities/negocio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plataforma, Negocio])],
  controllers: [PlataformasController],
  providers: [PlataformasService],
})
export class PlataformasModule {}
