// src/entities/movimiento-inventario.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Plataforma } from './plataforma.entity';
import { Negocio } from './negocio.entity';

@Entity('movimientos_inventario')
export class MovimientoInventario {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Plataforma, { eager: true })
  @JoinColumn({ name: 'plataformaId' })
  plataforma: Plataforma;

  @Column()
  plataformaId: number;

  @ManyToOne(() => Negocio, { eager: true })
  @JoinColumn({ name: 'negocioId' })
  negocio: Negocio;

  @Column()
  negocioId: number;

  @CreateDateColumn({ type: 'timestamp' })
  fecha: Date;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'int', nullable: true })
  entrada_cant: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  entrada_pu: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  entrada_pt: number;

  @Column({ type: 'int', nullable: true })
  salida_cant: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salida_pu: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salida_pt: number;

  @Column({ type: 'int' })
  saldo_cant: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  saldo_pu: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  saldo_pt: number;
}
