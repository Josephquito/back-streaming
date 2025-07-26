import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Negocio } from './negocio.entity';
import { Perfil } from './perfil.entity';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  contacto: string;

  @Column()
  clave: string;

  @ManyToMany(() => Negocio, (negocio) => negocio.clientes)
  @JoinTable({
    name: 'clientes_negocios', // tabla intermedia
    joinColumn: { name: 'cliente_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'negocio_id', referencedColumnName: 'id' },
  })
  negocios: Negocio[];

  @CreateDateColumn()
  fecha_creacion: Date;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Perfil, (perfil) => perfil.cliente)
  perfiles: Perfil[];
}
