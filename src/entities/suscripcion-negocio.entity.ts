// src/entities/suscripcion-negocio.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Negocio } from './negocio.entity';

export enum EstadoSuscripcion {
  ACTIVO = 'activo',
  VENCIDO = 'vencido',
  ANULADO = 'anulado',
}

@Entity('suscripciones_negocio')
export class SuscripcionNegocio {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Negocio, (negocio) => negocio.suscripciones)
  negocio: Negocio;

  @Column({ type: 'date' })
  fecha_inicio: string;

  @Column({ type: 'date' })
  fecha_fin: string;

  @Column('decimal')
  monto: number;

  @Column({ type: 'enum', enum: EstadoSuscripcion })
  estado: EstadoSuscripcion;

  @Column({ type: 'text', nullable: true })
  observaciones: string;
}
