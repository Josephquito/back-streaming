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
  tiempo_asignado: string;

  @Column({ type: 'date' })
  fecha_venta: Date;

  @Column({ type: 'date', nullable: true })
  fecha_corte: string | null;

  @Column('decimal', { precision: 10, scale: 2 })
  precio: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costo: number;

  @Column('decimal', { precision: 10, scale: 2 })
  ganancia: number;

  // ✅ Relación con Cuenta (nullable)
  @ManyToOne(() => Cuenta, (cuenta) => cuenta.perfiles, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cuentaId' })
  cuenta: Cuenta | null;

  @Column({ nullable: true })
  cuentaId: number | null;

  // ✅ Copias de seguridad para historial
  @Column({ type: 'varchar', nullable: true })
  correo_asignado: string;

  @Column({ type: 'varchar', nullable: true })
  plataforma_asignada: string;

  // Relaciones normales
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

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'date', nullable: true })
  fecha_baja: string | null;
}
