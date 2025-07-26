// src/entities/plataforma.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Cuenta } from './cuenta.entity';
import { Negocio } from './negocio.entity';

@Entity('plataformas')
export class Plataforma {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  color: string;

  @ManyToOne(() => Negocio, (negocio) => negocio.plataformas)
  negocio: Negocio;

  @OneToMany(() => Cuenta, (cuenta) => cuenta.plataforma)
  cuentas: Cuenta[];
}
