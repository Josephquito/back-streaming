//src/entities/perfil.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Cuenta } from 'src/entities/cuenta.entity';
import { Usuario } from 'src/entities/usuario.entity';
import { Cliente } from 'src/entities/cliente.entity';

@Entity('perfiles')
export class Perfil {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tiempo_asignado: string; // Ej: "1 mes", "30 días"

  @Column({ type: 'date' })
  fecha_venta: Date; // se ingresa

  @Column({ type: 'date' })
  fecha_corte: string; // se calcula

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number; // se ingresa

  @Column('decimal', { precision: 10, scale: 2 })
  costo: number; // cuenta.costo_total / cuenta.numero_perfiles

  @Column('decimal', { precision: 10, scale: 2 })
  ganancia: number;

  @ManyToOne(() => Cuenta, (cuenta) => cuenta.perfiles, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cuentaId' })
  cuenta: Cuenta;

  @Column()
  cuentaId: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.perfiles, { eager: true })
  @JoinColumn({ name: 'clienteId' })
  cliente: Cliente;

  @Column()
  clienteId: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.perfiles_vendidos, {
    eager: true,
  })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @Column()
  usuarioId: number;

  @CreateDateColumn()
  fecha_insercion: Date;
}
