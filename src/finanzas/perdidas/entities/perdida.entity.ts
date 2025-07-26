import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Negocio } from 'src/entities/negocio.entity';

@Entity('perdidas')
export class Perdida {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  motivo: string;

  @Column()
  tipo: 'reembolso' | 'reemplazo' | 'estafa' | 'garantía';

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
