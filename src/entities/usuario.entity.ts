import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Negocio } from './negocio.entity';
import { Perfil } from './perfil.entity';

export enum RolUsuario {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  EMPLEADO = 'empleado',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ nullable: true })
  cedula: string;

  @Column({ unique: true })
  correo: string;

  @Column()
  clave: string;

  @Column({ nullable: true })
  telefono: string;

  @ManyToOne(() => Negocio, (negocio) => negocio.usuarios, {
    nullable: true,
    onDelete: 'CASCADE',
    cascade: true, // ✅ Esto permite crear el negocio junto al usuario
    eager: true, // ✅ Esto hace que se retorne automáticamente con el usuario
  })
  @JoinColumn({ name: 'negocioid' })
  negocio?: Negocio;

  @Column({ type: 'enum', enum: RolUsuario })
  rol: RolUsuario;

  @Column({ default: true })
  activo: boolean;

  @OneToMany(() => Perfil, (perfil) => perfil.usuario)
  perfiles_vendidos: Perfil[];
}
