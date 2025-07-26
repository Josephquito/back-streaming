// src/entities/cuenta.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Plataforma } from './plataforma.entity';
import { Negocio } from './negocio.entity';
import { Perfil } from './perfil.entity';

@Entity('cuentas')
@Unique(['correo', 'plataformaId', 'negocioId'])
export class Cuenta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  correo: string;

  @Column()
  clave: string;

  @Column({ type: 'date' })
  fecha_compra: string;

  @Column()
  tiempo_asignado: string;

  @Column({ type: 'date' })
  fecha_corte: string;

  @Column()
  proveedor: string;

  @Column('decimal', { precision: 10, scale: 2 })
  costo_total: number;

  @Column('int')
  numero_perfiles: number;

  @ManyToOne(() => Negocio, (negocio) => negocio.cuentas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'negocioId' })
  negocio: Negocio;

  @Column()
  negocioId: number;

  @ManyToOne(() => Plataforma, (plataforma) => plataforma.cuentas, {
    eager: true,
  })
  @JoinColumn({ name: 'plataformaId' })
  plataforma: Plataforma;

  @Column()
  plataformaId: number;

  @OneToMany(() => Perfil, (perfil) => perfil.cuenta)
  perfiles: Perfil[];

  @Column({ default: false })
  inhabilitada: boolean;
}
