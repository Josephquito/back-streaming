import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Negocio } from 'src/entities/negocio.entity';

@Entity('compras_inversiones')
export class CompraInversion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  detalle: string;

  @Column('decimal', { precision: 10, scale: 2 })
  valor: number;

  @CreateDateColumn()
  fecha_creacion: Date;

  @ManyToOne(() => Negocio, { eager: true })
  @JoinColumn({ name: 'negocioId' })
  negocio: Negocio;

  @Column()
  negocioId: number;
}
