// src/entities/bitacora-accion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

export enum RolBitacora {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  EMPLEADO = 'empleado',
  CLIENTE = 'cliente',
}

@Entity('bitacora_acciones')
export class BitacoraAccion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Usuario)
  usuario: Usuario;

  @Column({ type: 'enum', enum: RolBitacora })
  rol: RolBitacora;

  @Column()
  accion: string;

  @Column()
  tabla_afectada: string;

  @Column({ nullable: true })
  id_afectado: number;

  @Column({ type: 'text', nullable: true })
  detalles: string;

  @CreateDateColumn()
  fecha: Date;

  @Column({ nullable: true })
  ip: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;
}
