import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { SuscripcionNegocio } from './suscripcion-negocio.entity';
import { Cuenta } from './cuenta.entity';
import { Cliente } from './cliente.entity';
import { Plataforma } from './plataforma.entity';

@Entity('negocios')
export class Negocio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  correo_contacto: string;

  @Column()
  telefono: string;

  @CreateDateColumn()
  fecha_creacion: Date;

  @Column({ default: true })
  activo: boolean;

  // 👉 Esto permite que al eliminar el admin se elimine también su negocio
  @OneToOne(() => Usuario, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_user_id' })
  admin?: Usuario;

  // 👉 Relación con empleados (usuarios)
  @OneToMany(() => Usuario, (usuario) => usuario.negocio)
  usuarios: Usuario[];

  @ManyToMany(() => Cliente, (cliente) => cliente.negocios)
  clientes: Cliente[];

  @OneToMany(() => Cuenta, (cuenta) => cuenta.negocio)
  cuentas: Cuenta[];

  @OneToMany(() => SuscripcionNegocio, (s) => s.negocio)
  suscripciones: SuscripcionNegocio[];

  @OneToMany(() => Plataforma, (plataforma) => plataforma.negocio)
  plataformas: Plataforma[];
}
